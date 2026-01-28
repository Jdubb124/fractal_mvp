import { Request, Response } from 'express';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { emailService } from '../services/email.service';
import { EmailAsset } from '../models';
import archiver from 'archiver';

// @desc    Generate HTML email assets for a campaign
// @route   POST /api/emails/generate
// @access  Private
export const generateEmails = asyncHandler(async (req: Request, res: Response) => {
  const {
    campaignId,
    templateId = 'minimal',
    regenerate = false,
    generationMode = 'ai-designed'
  } = req.body;

  if (!campaignId) {
    throw new AppError('Campaign ID is required', 400);
  }

  const result = await emailService.generateEmailAssets({
    campaignId,
    userId: req.userId!,
    templateId,
    regenerate,
    generationMode,
  });

  res.status(201).json({
    success: true,
    message: `Generated ${result.totalGenerated} email assets using ${generationMode} mode`,
    data: result,
  });
});

// @desc    Get all email assets for a campaign
// @route   GET /api/emails/campaign/:campaignId
// @access  Private
export const getEmailAssetsByCampaign = asyncHandler(async (req: Request, res: Response) => {
  const { campaignId } = req.params;

  const emailAssets = await emailService.getEmailAssetsByCampaign(campaignId, req.userId!);

  res.json({
    success: true,
    count: emailAssets.length,
    data: emailAssets,
  });
});

// @desc    Get single email asset
// @route   GET /api/emails/:assetId
// @access  Private
export const getEmailAsset = asyncHandler(async (req: Request, res: Response) => {
  const { assetId } = req.params;

  const emailAsset = await emailService.getEmailAsset(assetId, req.userId!);

  if (!emailAsset) {
    throw new AppError('Email asset not found', 404);
  }

  res.json({
    success: true,
    data: emailAsset,
  });
});

// @desc    Export single email asset
// @route   GET /api/emails/:assetId/export
// @access  Private
export const exportEmail = asyncHandler(async (req: Request, res: Response) => {
  const { assetId } = req.params;
  const { format = 'html', download = 'false' } = req.query;

  const exportData = await emailService.exportEmail(
    assetId,
    req.userId!,
    format as string
  );

  if (download === 'true') {
    res.setHeader('Content-Disposition', `attachment; filename="${exportData.filename}"`);
    res.setHeader('Content-Type', exportData.mimeType);
    res.send(exportData.content);
  } else {
    res.json({
      success: true,
      data: exportData,
    });
  }
});

// @desc    Bulk export email assets as ZIP
// @route   POST /api/emails/export/bulk
// @access  Private
export const bulkExportEmails = asyncHandler(async (req: Request, res: Response) => {
  const { assetIds, format = 'html', organizationStrategy = 'flat' } = req.body;

  if (!assetIds || !Array.isArray(assetIds) || assetIds.length === 0) {
    throw new AppError('Asset IDs array is required', 400);
  }

  // Verify all assets belong to user
  const assets = await EmailAsset.find({
    _id: { $in: assetIds },
    userId: req.userId,
  });

  if (assets.length !== assetIds.length) {
    throw new AppError('One or more assets not found or unauthorized', 404);
  }

  // Set up ZIP archive
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', 'attachment; filename="fractal-emails-export.zip"');

  const archive = archiver('zip', { zlib: { level: 9 } });
  archive.pipe(res);

  // Add each asset to the archive
  for (const asset of assets) {
    const exportData = await emailService.exportEmail(
      asset._id.toString(),
      req.userId!,
      format
    );

    let filepath: string;
    if (organizationStrategy === 'by_audience') {
      filepath = `${asset.audienceSnapshot.name}/${exportData.filename}`;
    } else if (organizationStrategy === 'by_type') {
      filepath = `${asset.emailType}/${exportData.filename}`;
    } else {
      filepath = exportData.filename;
    }

    archive.append(exportData.content, { name: filepath });
  }

  await archive.finalize();
});

// @desc    Update email asset HTML
// @route   PUT /api/emails/:assetId
// @access  Private
export const updateEmail = asyncHandler(async (req: Request, res: Response) => {
  const { assetId } = req.params;
  const { html, editType, prompt } = req.body;

  if (!html) {
    throw new AppError('HTML content is required', 400);
  }

  if (!editType || !['manual', 'ai_assisted'].includes(editType)) {
    throw new AppError('Valid edit type is required (manual or ai_assisted)', 400);
  }

  const emailAsset = await emailService.updateEmail(
    assetId,
    req.userId!,
    html,
    editType,
    prompt
  );

  res.json({
    success: true,
    message: 'Email updated successfully',
    data: {
      emailAsset,
      inlinedHtml: emailAsset.html.inlinedHtml,
      plainText: emailAsset.html.plainText,
    },
  });
});

// @desc    AI-assisted email editing
// @route   POST /api/emails/:assetId/ai-edit
// @access  Private
export const aiEditEmail = asyncHandler(async (req: Request, res: Response) => {
  const { assetId } = req.params;
  const { prompt, preserveStructure = true } = req.body;

  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    throw new AppError('Prompt is required', 400);
  }

  const result = await emailService.aiEditEmail(
    assetId,
    req.userId!,
    prompt.trim(),
    preserveStructure
  );

  res.json({
    success: true,
    message: 'AI edit applied successfully',
    data: result,
  });
});

// @desc    Approve email asset
// @route   PATCH /api/emails/:assetId/approve
// @access  Private
export const approveEmail = asyncHandler(async (req: Request, res: Response) => {
  const { assetId } = req.params;

  const emailAsset = await emailService.approveEmail(assetId, req.userId!);

  res.json({
    success: true,
    message: 'Email approved successfully',
    data: emailAsset,
  });
});

// @desc    Delete email assets by campaign
// @route   DELETE /api/emails/campaign/:campaignId
// @access  Private
export const deleteEmailAssetsByCampaign = asyncHandler(async (req: Request, res: Response) => {
  const { campaignId } = req.params;

  const deletedCount = await emailService.deleteEmailAssetsByCampaign(
    campaignId,
    req.userId!
  );

  res.json({
    success: true,
    message: `Deleted ${deletedCount} email assets`,
    data: { deletedCount },
  });
});
