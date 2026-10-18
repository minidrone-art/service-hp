module {
  /// Identifier unik untuk tiket servis.
  public type TicketId = Nat;

  /// Identifier unik untuk pelanggan.
  public type CustomerId = Nat;

  /// Identifier unik untuk perangkat.
  public type DeviceId = Nat;

  /// Waktu dalam nanodetik (IC Time.now()).
  public type Timestamp = Nat;

  /// Nomor tiket yang ditampilkan ke pengguna, mis. "TSV-000123".
  public type TicketNumber = Text;
};
