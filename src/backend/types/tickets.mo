import Common "common";

module {
  public type TicketId = Common.TicketId;
  public type CustomerId = Common.CustomerId;
  public type DeviceId = Common.DeviceId;
  public type Timestamp = Common.Timestamp;
  public type TicketNumber = Common.TicketNumber;

  /// Tahapan siklus hidup tiket servis, berurutan.
  public type TicketStatus = {
    #diterima;
    #diagnosa;
    #menungguSparepart;
    #dikerjakan;
    #selesai;
    #diambil;
  };

  /// Satu entri riwayat perubahan status (append-only).
  public type StatusHistoryEntry = {
    status : TicketStatus;
    timestamp : Timestamp;
    note : Text;
  };

  /// Catatan teknisi pada sebuah tiket.
  public type TechnicianNote = {
    timestamp : Timestamp;
    note : Text;
  };

  /// Data perangkat yang diservis.
  public type Device = {
    id : DeviceId;
    brand : Text;
    model : Text;
    color : Text;
    imei : Text;
    accessories : [Text];
  };

  /// Tiket servis lengkap (bentuk publik, semua field serializable).
  public type Ticket = {
    id : TicketId;
    ticketNumber : TicketNumber;
    customerId : CustomerId;
    customerName : Text;
    customerPhone : Text;
    device : Device;
    complaint : Text;
    accessories : [Text];
    estimatedCost : Nat;
    estimatedCompletionDate : Timestamp;
    status : TicketStatus;
    statusHistory : [StatusHistoryEntry];
    technicianNotes : [TechnicianNote];
    createdAt : Timestamp;
    updatedAt : Timestamp;
  };

  /// Ringkasan tiket untuk daftar/pencarian.
  public type TicketSummary = {
    id : TicketId;
    ticketNumber : TicketNumber;
    customerName : Text;
    customerPhone : Text;
    deviceBrand : Text;
    deviceModel : Text;
    imei : Text;
    status : TicketStatus;
    estimatedCost : Nat;
    estimatedCompletionDate : Timestamp;
    createdAt : Timestamp;
    updatedAt : Timestamp;
  };

  /// Input pembuatan tiket baru.
  public type CreateTicketInput = {
    customerName : Text;
    customerPhone : Text;
    deviceBrand : Text;
    deviceModel : Text;
    deviceColor : Text;
    imei : Text;
    complaint : Text;
    accessories : [Text];
    estimatedCost : Nat;
    estimatedCompletionDate : Timestamp;
  };

  /// Input pembaruan tiket (semua field opsional).
  public type UpdateTicketInput = {
    customerName : ?Text;
    customerPhone : ?Text;
    deviceBrand : ?Text;
    deviceModel : ?Text;
    deviceColor : ?Text;
    imei : ?Text;
    complaint : ?Text;
    accessories : ?[Text];
    estimatedCost : ?Nat;
    estimatedCompletionDate : ?Timestamp;
  };

  /// Filter daftar tiket.
  public type TicketFilter = {
    search : ?Text;
    status : ?TicketStatus;
  };

  /// Kesalahan operasi tiket yang dapat ditangani pemanggil.
  public type TicketError = {
    #notFound : TicketId;
    #invalidTransition : { from : TicketStatus; to : TicketStatus };
    #alreadyPickedUp : TicketId;
    #unauthorized;
  };
};
