using System.ComponentModel.DataAnnotations;

namespace StudentCenter.Application.DTOs;

public class MarkNotificationReadRequest
{
    [Required(ErrorMessage = "Read state is required.")]
    public bool IsRead { get; set; }
}
