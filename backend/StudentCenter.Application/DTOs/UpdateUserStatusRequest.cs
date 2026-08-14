using System.ComponentModel.DataAnnotations;

namespace StudentCenter.Application.DTOs;

public class UpdateUserStatusRequest
{
    [Required(ErrorMessage = "Active status is required.")]
    public bool IsActive { get; set; }
}
