import Common "common";

module {
  public type CustomerId = Common.CustomerId;
  public type DeviceId = Common.DeviceId;
  public type TicketId = Common.TicketId;
  public type Timestamp = Common.Timestamp;

  /// Data kontak pelanggan.
  public type Customer = {
    id : CustomerId;
    name : Text;
    phone : Text;
    email : ?Text;
    address : ?Text;
    createdAt : Timestamp;
  };

  /// Perangkat yang terdaftar pada seorang pelanggan.
  public type CustomerDevice = {
    id : DeviceId;
    customerId : CustomerId;
    brand : Text;
    model : Text;
    color : Text;
    imei : Text;
    createdAt : Timestamp;
  };

  /// Ringkasan riwayat servis sebuah perangkat.
  public type DeviceServiceHistoryEntry = {
    ticketId : TicketId;
    ticketNumber : Text;
    complaint : Text;
    status : Text;
    createdAt : Timestamp;
  };

  /// Profil pelanggan beserta perangkat dan riwayat servisnya.
  public type CustomerProfile = {
    customer : Customer;
    devices : [CustomerDevice];
    tickets : [TicketId];
  };

  /// Input pembuatan pelanggan baru.
  public type CreateCustomerInput = {
    name : Text;
    phone : Text;
    email : ?Text;
    address : ?Text;
  };

  /// Input pembaruan pelanggan (semua field opsional).
  public type UpdateCustomerInput = {
    name : ?Text;
    phone : ?Text;
    email : ?Text;
    address : ?Text;
  };

  /// Kesalahan operasi pelanggan.
  public type CustomerError = {
    #notFound : CustomerId;
    #unauthorized;
  };
};
