namespace StudentCenter.Domain.Entities;

public class GroupMessageRecipientEnvelope
{
    public Guid Id { get; set; }
    public Guid MessageId { get; set; }
    public GroupMessage Message { get; set; } = null!;

    public Guid RecipientUserId { get; set; }
    public User RecipientUser { get; set; } = null!;

    /// <summary>Sender key package encrypted with recipient device public key.</summary>
    public string EncryptedKeyPackage { get; set; } = string.Empty;
}
