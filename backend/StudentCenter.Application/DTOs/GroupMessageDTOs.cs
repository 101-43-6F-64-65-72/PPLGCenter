namespace StudentCenter.Application.DTOs;

public class GroupMessageResponse
{
    public Guid Id { get; set; }
    public Guid GroupId { get; set; }
    public Guid SenderUserId { get; set; }
    public string SenderName { get; set; } = string.Empty;
    public string EncryptedPayloadBase64 { get; set; } = string.Empty;
    public string Nonce { get; set; } = string.Empty;
    public DateTime SentAt { get; set; }
    public List<RecipientEnvelopeResponse> Envelopes { get; set; } = new();
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
    public string EncryptedPayloadBase64 { get; set; } = string.Empty;
    public string Nonce { get; set; } = string.Empty;
    public List<RecipientEnvelopeRequest> RecipientEnvelopes { get; set; } = new();
}
