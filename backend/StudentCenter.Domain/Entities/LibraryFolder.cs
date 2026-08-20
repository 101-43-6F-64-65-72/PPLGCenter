using System;
using System.Collections.Generic;

namespace StudentCenter.Domain.Entities;

public class LibraryFolder
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid? ParentFolderId { get; set; }
    public string VisibilityType { get; set; } = "Public"; // "Public", "TeachersOnly", "TargetedClasses"
    public string? AllowedClassIdsJson { get; set; } // e.g. ["guid1", "guid2"]
    public Guid CreatedByUserId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public LibraryFolder? ParentFolder { get; set; }
    public ICollection<LibraryFolder> SubFolders { get; set; } = new List<LibraryFolder>();
    public ICollection<Book> Books { get; set; } = new List<Book>();
    public User? CreatedByUser { get; set; }
}
