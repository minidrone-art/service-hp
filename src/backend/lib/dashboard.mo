import Common "../types/common";
import Tickets "../types/tickets";
import Types "../types/dashboard";

module {
  public type Ticket = Tickets.Ticket;
  public type TicketStatus = Tickets.TicketStatus;
  public type StatusCounts = Types.StatusCounts;
  public type AttentionTicket = Types.AttentionTicket;
  public type DashboardSummary = Types.DashboardSummary;

  /// Hitung jumlah tiket per status.
  public func countByStatus(tickets : [Ticket]) : StatusCounts {
    var diterima = 0;
    var diagnosa = 0;
    var menungguSparepart = 0;
    var dikerjakan = 0;
    var selesai = 0;
    var diambil = 0;
    for (ticket in tickets.values()) {
      switch (ticket.status) {
        case (#diterima) { diterima += 1 };
        case (#diagnosa) { diagnosa += 1 };
        case (#menungguSparepart) { menungguSparepart += 1 };
        case (#dikerjakan) { dikerjakan += 1 };
        case (#selesai) { selesai += 1 };
        case (#diambil) { diambil += 1 };
      };
    };
    { diterima; diagnosa; menungguSparepart; dikerjakan; selesai; diambil };
  };

  /// Tiket yang menunggu sparepart atau mendekati/melewati estimasi selesai.
  /// "Mendekati" berarti estimasi selesai dalam 3 hari ke depan (nanodetik).
  public func attentionTickets(tickets : [Ticket], now : Common.Timestamp) : [AttentionTicket] {
    let approachingWindow : Nat = 3 * 24 * 60 * 60 * 1_000_000_000;
    let active = tickets.filter(func ticket = ticket.status != #diambil);
    let flagged = active.filter(func ticket =
      ticket.status == #menungguSparepart
      or ticket.estimatedCompletionDate <= now + approachingWindow
    );
    flagged.map(func ticket = {
      id = ticket.id;
      ticketNumber = ticket.ticketNumber;
      customerName = ticket.customerName;
      status = ticket.status;
      estimatedCompletionDate = ticket.estimatedCompletionDate;
      overdue = ticket.estimatedCompletionDate <= now;
    });
  };

  /// Total pendapatan dari tiket yang sudah diambil.
  public func totalRevenue(tickets : [Ticket]) : Nat {
    tickets.foldLeft(0, func(acc, ticket) =
      if (ticket.status == #diambil) { acc + ticket.estimatedCost } else { acc }
    );
  };
};
