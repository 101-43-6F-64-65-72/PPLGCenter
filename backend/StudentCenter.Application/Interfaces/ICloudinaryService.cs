namespace StudentCenter.Application.Interfaces;

public interface ICloudinaryService
{
    /// <summary>
    /// Checks whether Cloudinary credentials (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) are configured.
    /// </summary>
    bool IsConfigured { get; }

    /// <summary>
    /// Uploads an image binary stream to Cloudinary and returns its secure HTTPS URL.
    /// </summary>
    /// <param name="fileStream">Image binary stream</param>
    /// <param name="fileName">Original filename</param>
    /// <param name="contentType">MIME type (image/png, image/jpeg, etc.)</param>
    /// <param name="folder">Cloudinary target folder name</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Cloudinary secure HTTPS URL (e.g. https://res.cloudinary.com/cloudname/image/upload/...)</returns>
    Task<string> UploadImageAsync(
        Stream fileStream,
        string fileName,
        string contentType,
        string folder = "student-center",
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Deletes an image from Cloudinary using its secure URL or public ID.
    /// </summary>
    /// <param name="imageUrlOrPublicId">Cloudinary secure URL or public ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>True if deletion succeeded or skipped safely; false if error</returns>
    Task<bool> DeleteImageAsync(
        string? imageUrlOrPublicId,
        CancellationToken cancellationToken = default);
}
