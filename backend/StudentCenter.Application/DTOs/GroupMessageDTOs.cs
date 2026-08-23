namespace StudentCenter.Application.DTOs;

public class GroupMessageResponse
{
    public Guid Id { get; set; }
    public Guid GroupId { get; set; }
    public Guid SenderUserId { get; set; }
    public string SenderName { get; set; } = string.Empty;

    public Guid? ReplyToMessageId { get; set; }
    public string? ReplyToSenderName { get; set; }
    public string? ReplyToEncryptedPayloadBase64 { get; set; }

    public string EncryptedPayloadBase64 { get; set; } = string.Empty;
    public string Nonce { get; set; } = string.Empty;
    public DateTime SentAt { get; set; }

    public bool IsEdited { get; set; }
    public DateTime? EditedAt { get; set; }

    public bool IsDeletedForEveryone { get; set; }

    public List<RecipientEnvelopeResponse> Envelopes { get; set; } = new();
    public Dictionary<string, int> Reactions { get; set; } = new();
    public string? UserReaction { get; set; }
}

public class RecipientEnvelopeResponse
{
    public Guid RecipientUserId { get; set; }
    public string EncryptedKeyPackage { get; set; } = string.Empty;
}

public class RecipientEnvelopeRequest
{
    public Guid RecipientUserId { get; set; }
    public string EncryptedKeyPackage { get; set; } = string.Empty;
}

public class SendGroupMessageRequest
{
    public Guid GroupId { get; set; }
    public Guid? ReplyToMessageId { get; set; }
    public string EncryptedPayloadBase64 { get; set; } = string.Empty;
    public string Nonce { get; set; } = string.Empty;
    public List<RecipientEnvelopeRequest> RecipientEnvelopes { get; set; } = new();
}

public class EditGroupMessageRequest
{
    public string EncryptedPayloadBase64 { get; set; } = string.Empty;
    public string Nonce { get; set; } = string.Empty;
}

public class ToggleGroupMessageReactionRequest
{
    public string Emoji { get; set; } = string.Empty;
}
