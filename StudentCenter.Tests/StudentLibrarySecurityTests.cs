using Microsoft.EntityFrameworkCore;
using StudentCenter.Application.DTOs;
using StudentCenter.Domain.Entities;
using StudentCenter.Domain.Enums;
using StudentCenter.Infrastructure.Data;
using StudentCenter.Infrastructure.Services;
using Xunit;

namespace StudentCenter.Tests;

public class StudentLibrarySecurityTests
{
    private AppDbContext GetInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        var context = new AppDbContext(options);
        SeedTestData(context);
        return context;
    }

    private void SeedTestData(AppDbContext context)
    {
        var admin = new User { Id = Guid.NewGuid(), FullName = "Admin Lib", Email = "adm_lib@sch.id", Role = UserRole.Admin, IsActive = true };
        var teacherManager = new User { Id = Guid.NewGuid(), FullName = "Guru Manager Pemrograman", Email = "mgr_prog@sch.id", Role = UserRole.Teacher, IsActive = true };
        var teacherUnassigned = new User { Id = Guid.NewGuid(), FullName = "Guru Umum", Email = "guru_umum@sch.id", Role = UserRole.Teacher, IsActive = true };
        var student1 = new User { Id = Guid.NewGuid(), FullName = "Student 1 Lib", Email = "s1_lib@sch.id", Role = UserRole.Student, IsActive = true };
        var student2 = new User { Id = Guid.NewGuid(), FullName = "Student 2 Lib", Email = "s2_lib@sch.id", Role = UserRole.Student, IsActive = true };

        context.Users.AddRange(admin, teacherManager, teacherUnassigned, student1, student2);

        var book1 = new Book
        {
            Id = Guid.NewGuid(),
            Title = "Pemrograman C# Modern",
            Author = "John Doe",
            Category = "Pemrograman",
            TotalCopies = 3,
            AvailableCopies = 3,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var book2 = new Book
        {
            Id = Guid.NewGuid(),
            Title = "Desain Database Relasional",
            Author = "Jane Smith",
            Category = "Database",
            TotalCopies = 2,
            AvailableCopies = 2,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        context.Books.AddRange(book1, book2);

        // Assign teacherManager as BookManager for "Pemrograman"
        var bm = new BookManager
        {
            Id = Guid.NewGuid(),
            BookCategory = "Pemrograman",
            ManagerUserId = teacherManager.Id,
            AssignedAt = DateTime.UtcNow
        };
        context.BookManagers.Add(bm);

        context.SaveChangesAsync().Wait();
    }

    [Fact]
    public async Task Test_1_StudentCanRequestBorrowAndRetrieveOwnRequests()
    {
        var context = GetInMemoryDbContext();
        var service = new BookService(context);

        var student1 = await context.Users.FirstAsync(u => u.Email == "s1_lib@sch.id");
        var book = await context.Books.FirstAsync(b => b.Category == "Pemrograman");

        var req = await service.RequestBorrowAsync(student1.Id, new CreateBookBorrowRequest
        {
            BookId = book.Id,
            RequestedDays = 7
        });

        Assert.NotNull(req);
        Assert.Equal(BookBorrowStatus.Pending, req.Status);

        var myRequests = await service.GetMyBorrowRequestsAsync(student1.Id, page: 1, pageSize: 10);
        Assert.Single(myRequests.Items);
        Assert.Equal("Pemrograman C# Modern", myRequests.Items[0].BookTitle);
    }

    [Fact]
    public async Task Test_2_StudentCannotInspectAnotherStudentBorrowRequest()
    {
        var context = GetInMemoryDbContext();
        var service = new BookService(context);

        var student1 = await context.Users.FirstAsync(u => u.Email == "s1_lib@sch.id");
        var student2 = await context.Users.FirstAsync(u => u.Email == "s2_lib@sch.id");
        var book = await context.Books.FirstAsync(b => b.Category == "Pemrograman");

        var req = await service.RequestBorrowAsync(student1.Id, new CreateBookBorrowRequest
        {
            BookId = book.Id,
            RequestedDays = 7
        });

        // Student 2 attempting to view Student 1's borrow request throws UnauthorizedAccessException
        await Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
        {
            await service.GetBorrowRequestByIdAsync(req.Id, requestingUserId: student2.Id, userRole: "Student");
        });
    }

    [Fact]
    public async Task Test_3_ApprovedBookCanBeReturned()
    {
        var context = GetInMemoryDbContext();
        var service = new BookService(context);

        var student = await context.Users.FirstAsync(u => u.Email == "s1_lib@sch.id");
        var admin = await context.Users.FirstAsync(u => u.Role == UserRole.Admin);
        var book = await context.Books.FirstAsync(b => b.Category == "Pemrograman");

        var req = await service.RequestBorrowAsync(student.Id, new CreateBookBorrowRequest { BookId = book.Id });
        var approved = await service.ProcessBorrowRequestAsync(req.Id, new ProcessBorrowRequest { Approve = true }, admin.Id, "Admin");

        Assert.NotNull(approved);
        Assert.Equal(BookBorrowStatus.Approved, approved!.Status);
        Assert.Equal(2, (await context.Books.FirstAsync(b => b.Id == book.Id)).AvailableCopies);

        var returned = await service.MarkBookReturnedAsync(req.Id, admin.Id, "Admin");
        Assert.NotNull(returned);
        Assert.Equal(BookBorrowStatus.Returned, returned!.Status);
        Assert.Equal(3, (await context.Books.FirstAsync(b => b.Id == book.Id)).AvailableCopies);
    }

    [Fact]
    public async Task Test_4_OverdueBookCanBeReturned_SEC02()
    {
        var context = GetInMemoryDbContext();
        var service = new BookService(context);

        var student = await context.Users.FirstAsync(u => u.Email == "s1_lib@sch.id");
        var admin = await context.Users.FirstAsync(u => u.Role == UserRole.Admin);
        var book = await context.Books.FirstAsync(b => b.Category == "Pemrograman");

        var req = await service.RequestBorrowAsync(student.Id, new CreateBookBorrowRequest { BookId = book.Id });
        await service.ProcessBorrowRequestAsync(req.Id, new ProcessBorrowRequest { Approve = true }, admin.Id, "Admin");

        // Manually update status to Overdue to simulate time elapsed
        var entity = await context.BookBorrowRequests.FirstAsync(r => r.Id == req.Id);
        entity.Status = BookBorrowStatus.Overdue;
        await context.SaveChangesAsync();

        // SEC-02 Fix Test: Returning an Overdue book MUST succeed!
        var returned = await service.MarkBookReturnedAsync(req.Id, admin.Id, "Admin");

        Assert.NotNull(returned);
        Assert.Equal(BookBorrowStatus.Returned, returned!.Status);
        Assert.NotNull(returned.ReturnDate);
        Assert.Equal(3, (await context.Books.FirstAsync(b => b.Id == book.Id)).AvailableCopies);
    }

    [Fact]
    public async Task Test_5_PendingOrRejectedBookCannotBeReturned()
    {
        var context = GetInMemoryDbContext();
        var service = new BookService(context);

        var student = await context.Users.FirstAsync(u => u.Email == "s1_lib@sch.id");
        var admin = await context.Users.FirstAsync(u => u.Role == UserRole.Admin);
        var book = await context.Books.FirstAsync(b => b.Category == "Pemrograman");

        var pendingReq = await service.RequestBorrowAsync(student.Id, new CreateBookBorrowRequest { BookId = book.Id });

        // Attempting to return a Pending book throws InvalidOperationException
        await Assert.ThrowsAsync<InvalidOperationException>(async () =>
        {
            await service.MarkBookReturnedAsync(pendingReq.Id, admin.Id, "Admin");
        });

        // Reject the request
        await service.ProcessBorrowRequestAsync(pendingReq.Id, new ProcessBorrowRequest { Approve = false, RejectionReason = "Not eligible" }, admin.Id, "Admin");

        // Attempting to return a Rejected book throws InvalidOperationException
        await Assert.ThrowsAsync<InvalidOperationException>(async () =>
        {
            await service.MarkBookReturnedAsync(pendingReq.Id, admin.Id, "Admin");
        });
    }

    [Fact]
    public async Task Test_6_AssignedManagerCanApproveCategoryBorrow_SEC03()
    {
        var context = GetInMemoryDbContext();
        var service = new BookService(context);

        var student = await context.Users.FirstAsync(u => u.Email == "s1_lib@sch.id");
        var teacherManager = await context.Users.FirstAsync(u => u.Email == "mgr_prog@sch.id");
        var book = await context.Books.FirstAsync(b => b.Category == "Pemrograman");

        var req = await service.RequestBorrowAsync(student.Id, new CreateBookBorrowRequest { BookId = book.Id });

        var processed = await service.ProcessBorrowRequestAsync(req.Id, new ProcessBorrowRequest { Approve = true }, teacherManager.Id, "Teacher");

        Assert.NotNull(processed);
        Assert.Equal(BookBorrowStatus.Approved, processed!.Status);
        Assert.Equal(teacherManager.Id, processed.ApprovedByUserId);
    }

    [Fact]
    public async Task Test_7_UnassignedTeacherCannotApproveOtherCategoryBorrow_SEC03()
    {
        var context = GetInMemoryDbContext();
        var service = new BookService(context);

        var student = await context.Users.FirstAsync(u => u.Email == "s1_lib@sch.id");
        var teacherUnassigned = await context.Users.FirstAsync(u => u.Email == "guru_umum@sch.id");
        var book = await context.Books.FirstAsync(b => b.Category == "Pemrograman"); // Manager assigned to teacherManager

        var req = await service.RequestBorrowAsync(student.Id, new CreateBookBorrowRequest { BookId = book.Id });

        // Unassigned teacher attempting to approve throws UnauthorizedAccessException (403)
        await Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
        {
            await service.ProcessBorrowRequestAsync(req.Id, new ProcessBorrowRequest { Approve = true }, teacherUnassigned.Id, "Teacher");
        });
    }

    [Fact]
    public async Task Test_8_StudentCannotApproveOrRejectBorrowRequest()
    {
        var context = GetInMemoryDbContext();
        var service = new BookService(context);

        var student1 = await context.Users.FirstAsync(u => u.Email == "s1_lib@sch.id");
        var student2 = await context.Users.FirstAsync(u => u.Email == "s2_lib@sch.id");
        var book = await context.Books.FirstAsync(b => b.Category == "Pemrograman");

        var req = await service.RequestBorrowAsync(student1.Id, new CreateBookBorrowRequest { BookId = book.Id });

        await Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
        {
            await service.ProcessBorrowRequestAsync(req.Id, new ProcessBorrowRequest { Approve = true }, student2.Id, "Student");
        });
    }

    [Fact]
    public async Task Test_9_AdminRetainsGlobalLibraryManagement()
    {
        var context = GetInMemoryDbContext();
        var service = new BookService(context);

        var admin = await context.Users.FirstAsync(u => u.Role == UserRole.Admin);

        var newBook = await service.CreateBookAsync(new CreateBookRequest
        {
            Title = "Buku Rekayasa Perangkat Lunak",
            Author = "Admin Author",
            Category = "DevOps",
            TotalCopies = 5
        }, admin.Id, "Admin");

        Assert.NotNull(newBook);
        Assert.Equal("Buku Rekayasa Perangkat Lunak", newBook.Title);
    }

    [Fact]
    public async Task Test_10_PageSizeIsCappedAt100_SEC04()
    {
        var context = GetInMemoryDbContext();
        var service = new BookService(context);

        var student = await context.Users.FirstAsync(u => u.Email == "s1_lib@sch.id");

        // Requesting 1000 items per page gets capped at 100
        var paged = await service.GetMyBorrowRequestsAsync(student.Id, page: 1, pageSize: 1000);

        Assert.NotNull(paged);
        Assert.Equal(100, paged.PageSize);
    }

    [Fact]
    public async Task Test_11_DuplicateActiveBorrowRequestIsRejected()
    {
        var context = GetInMemoryDbContext();
        var service = new BookService(context);

        var student = await context.Users.FirstAsync(u => u.Email == "s1_lib@sch.id");
        var book = await context.Books.FirstAsync(b => b.Category == "Pemrograman");

        await service.RequestBorrowAsync(student.Id, new CreateBookBorrowRequest { BookId = book.Id });

        // Second active request for same book throws InvalidOperationException
        await Assert.ThrowsAsync<InvalidOperationException>(async () =>
        {
            await service.RequestBorrowAsync(student.Id, new CreateBookBorrowRequest { BookId = book.Id });
        });
    }
}
