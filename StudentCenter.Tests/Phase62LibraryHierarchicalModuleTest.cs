using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using StudentCenter.Application.DTOs;
using StudentCenter.Domain.Enums;
using StudentCenter.Infrastructure.Data;
using StudentCenter.Infrastructure.Services;
using Xunit;

namespace StudentCenter.Tests;

[Collection("LivePostgreSQL")]
public class Phase62LibraryHierarchicalModuleTest
{
    private const string ConnectionString = "Host=db.rwopazhqgvvrosdizmvt.supabase.co;Port=5432;Database=postgres;Username=postgres;Password=L7RzTWA4ZkpBVw1B;SSL Mode=Require;Trust Server Certificate=true;Pooling=false;";

    private AppDbContext GetDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(ConnectionString)
            .Options;
        return new AppDbContext(options);
    }

    [Fact]
    public async Task VerifyPhase62GoogleDriveHierarchyTargetedVisibilityAndBorrowingInbox()
    {
        using var db = GetDbContext();
        var libraryService = new LibraryService(db);

        var teacher = await db.Users.FirstOrDefaultAsync(u => u.Role == UserRole.Teacher);
        var schoolClass = await db.SchoolClasses.FirstOrDefaultAsync();

        Assert.NotNull(teacher);
        Assert.NotNull(schoolClass);

        var studentAllowed = await db.Users.FirstOrDefaultAsync(u => u.Role == UserRole.Student && u.ClassId == schoolClass.Id);
        var studentBlocked = await db.Users.FirstOrDefaultAsync(u => u.Role == UserRole.Student && u.ClassId != schoolClass.Id && u.ClassId != null);

        Assert.NotNull(studentAllowed);

        // 1. Teacher creates parent folder ("Akademik Uji")
        var parentFolder = await libraryService.CreateFolderAsync(new CreateLibraryFolderRequest
        {
            Name = "Akademik Uji " + Guid.NewGuid().ToString("N")[..6],
            Description = "Folder Utama Uji",
            VisibilityType = "Public"
        }, teacher.Id);

        Assert.NotNull(parentFolder);

        // 2. Teacher creates subfolder ("Buku Database Uji") with TargetedClasses visibility for studentAllowed's class
        var subFolder = await libraryService.CreateFolderAsync(new CreateLibraryFolderRequest
        {
            Name = "Buku Database Uji " + Guid.NewGuid().ToString("N")[..6],
            Description = "Subfolder Khusus Kelas",
            ParentFolderId = parentFolder.Id,
            VisibilityType = "TargetedClasses",
            AllowedClassIds = new List<Guid> { schoolClass.Id }
        }, teacher.Id);

        Assert.NotNull(subFolder);

        // 3. Teacher adds a Digital E-Book to the subfolder
        var book = await libraryService.CreateBookAsync(new CreateBookRequest
        {
            Title = "Buku Modul Database " + Guid.NewGuid().ToString("N")[..6],
            Author = "Guru PPLG",
            TotalCopies = 5,
            LocationType = "Digital",
            LocationDetails = "https://cloudinary.com/modul-db.pdf",
            FolderId = subFolder.Id
        }, teacher.Id);

        Assert.NotNull(book);

        // 4. Verify Student Allowed sees the subfolder
        var allowedFolders = await libraryService.GetFoldersAsync(parentFolder.Id, studentAllowed.Id);
        Assert.Contains(allowedFolders, f => f.Id == subFolder.Id);

        // 5. Verify Student Blocked (if exists) does NOT see the subfolder
        if (studentBlocked != null)
        {
            var blockedFolders = await libraryService.GetFoldersAsync(parentFolder.Id, studentBlocked.Id);
            Assert.DoesNotContain(blockedFolders, f => f.Id == subFolder.Id);
        }

        // 6. Student Allowed submits a Borrow Request
        var borrowReq = await libraryService.CreateBorrowRequestAsync(new CreateBorrowRequestDto
        {
            BookId = book.Id,
            BorrowDate = DateTime.UtcNow,
            DueDate = DateTime.UtcNow.AddDays(7),
            Notes = "Untuk keperluan tugas database"
        }, studentAllowed.Id);

        Assert.NotNull(borrowReq);
        Assert.Equal(teacher.Id, borrowReq.TargetTeacherId);

        // 7. Verify Borrow Request arrives INBOX of Teacher who created the book
        var teacherInbox = await libraryService.GetTargetedTeacherBorrowRequestsAsync(teacher.Id);
        Assert.Contains(teacherInbox, r => r.Id == borrowReq.Id);

        // 8. Teacher approves borrow request -> stock reduces
        var respondOk = await libraryService.RespondToBorrowRequestAsync(borrowReq.Id, true, "Disetujui", teacher.Id);
        Assert.True(respondOk);

        var updatedBook = await libraryService.GetBookByIdAsync(book.Id, teacher.Id);
        Assert.NotNull(updatedBook);
        Assert.Equal(4, updatedBook.AvailableCopies);

        // Clean up test folder & book
        await libraryService.DeleteFolderAsync(parentFolder.Id, teacher.Id);
    }
}
