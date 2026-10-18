import Common "common";
import Tickets "tickets";

module {
  public type TicketId = Common.TicketId;
  public type Timestamp = Common.Timestamp;
  public type TicketStatus = Tickets.TicketStatus;

  /// Jumlah tiket per status.
  public type StatusCounts = {
    diterima : Nat;
    diagnosa : Nat;
    menungguSparepart : Nat;
    dikerjakan : Nat;
    selesai : Nat;
    diambil : Nat;
  };

  /// Tiket yang perlu perhatian.
  public type AttentionTicket = {
    id : TicketId;
    ticketNumber : Text;
    customerName : Text;
    status : TicketStatus;
    estimatedCompletionDate : Timestamp;
    overdue : Bool;
  };

  /// Ringkasan dashboard.
  public type DashboardSummary = {
    counts : StatusCounts;
    attention : [AttentionTicket];
    totalRevenue : Nat;
  };
};
