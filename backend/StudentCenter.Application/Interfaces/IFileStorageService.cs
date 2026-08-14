namespace StudentCenter.Application.Interfaces;

public interface IFileStorageService
{
    /// <summary>
    /// Checks whether Supabase Storage credentials are environment-configured.
    /// </summary>
    bool IsConfigured { get; }

    /// <summary>
    /// Uploads a PDF file stream to Supabase Storage.
    /// </summary>
    /// <param name="fileStream">File binary stream</param>
    /// <param name="fileName">Original or requested filename</param>
    /// <param name="contentType">MIME type (must be application/pdf)</param>
    /// <param name="folder">Destination subfolder within documents bucket (e.g. proposals, materials, submissions)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Relative storage object path (e.g. proposals/550e8400-e29b-41d4-a716-446655440000.pdf)</returns>
    Task<string> UploadPdfAsync(
        Stream fileStream,
        string fileName,
        string contentType,
        string folder = "documents",
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Creates a temporary signed URL for viewing/downloading private PDF files.
    /// Passes through full HTTP/HTTPS legacy URLs unchanged.
    /// </summary>
    /// <param name="filePathOrUrl">Storage object path or legacy full URL</param>
    /// <param name="expiresIn">Signed URL validity duration (default 60 minutes)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Full accessible URL (Signed URL or legacy URL)</returns>
    Task<string> CreateSignedUrlAsync(
        string? filePathOrUrl,
        TimeSpan? expiresIn = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Deletes a file object from Supabase Storage if it is a storage path.
    /// </summary>
    /// <param name="filePathOrUrl">Storage object path</param>
    /// <param name="cancellationToken">Cancellation token</param>
    Task DeleteAsync(
        string? filePathOrUrl,
        CancellationToken cancellationToken = default);
}
