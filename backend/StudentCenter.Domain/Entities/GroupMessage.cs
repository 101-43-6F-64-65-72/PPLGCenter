namespace StudentCenter.Domain.Entities;

public class GroupMessage
{
    public Guid Id { get; set; }
    public Guid GroupId { get; set; }
    public CommunityGroup Group { get; set; } = null!;

    public Guid SenderUserId { get; set; }
    public User SenderUser { get; set; } = null!;

    public Guid? ReplyToMessageId { get; set; }
    public GroupMessage? ReplyToMessage { get; set; }

    /// <summary>Base64 ciphertext payload (AES-256-GCM / Signal protocol payload). No plaintext is stored.</summary>
    public string EncryptedPayloadBase64 { get; set; } = string.Empty;
    public string Nonce { get; set; } = string.Empty;

    public DateTime SentAt { get; set; } = DateTime.UtcNow;

    public bool IsEdited { get; set; } = false;
    public DateTime? EditedAt { get; set; }

    public bool IsDeletedForEveryone { get; set; } = false;
    public DateTime? DeletedForEveryoneAt { get; set; }

    public ICollection<GroupMessageRecipientEnvelope> RecipientEnvelopes { get; set; } = new List<GroupMessageRecipientEnvelope>();
    public ICollection<GroupMessageReaction> Reactions { get; set; } = new List<GroupMessageReaction>();
    public ICollection<GroupMessageDeletedUser> DeletedForUsers { get; set; } = new List<GroupMessageDeletedUser>();
}
