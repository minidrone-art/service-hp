import Common "../types/common";
import Types "../types/tickets";

module {
  public type TicketId = Common.TicketId;
  public type Ticket = Types.Ticket;
  public type TicketSummary = Types.TicketSummary;
  public type TicketStatus = Types.TicketStatus;
  public type TicketFilter = Types.TicketFilter;
  public type CreateTicketInput = Types.CreateTicketInput;
  public type UpdateTicketInput = Types.UpdateTicketInput;
  public type StatusHistoryEntry = Types.StatusHistoryEntry;
  public type TechnicianNote = Types.TechnicianNote;

  /// Urutan tahapan status tiket.
  public func statusOrder(status : TicketStatus) : Nat {
    switch (status) {
      case (#diterima) { 0 };
      case (#diagnosa) { 1 };
      case (#menungguSparepart) { 2 };
      case (#dikerjakan) { 3 };
      case (#selesai) { 4 };
      case (#diambil) { 5 };
    };
  };

  /// Apakah transisi status dari `from` ke `to` diizinkan.
  public func isValidTransition(from : TicketStatus, to : TicketStatus) : Bool {
    statusOrder(to) == statusOrder(from) + 1;
  };

  /// Label teks Indonesia untuk sebuah status.
  public func statusLabel(status : TicketStatus) : Text {
    switch (status) {
      case (#diterima) { "Diterima" };
      case (#diagnosa) { "Diagnosa" };
      case (#menungguSparepart) { "Menunggu Sparepart" };
      case (#dikerjakan) { "Dikerjakan" };
      case (#selesai) { "Selesai" };
      case (#diambil) { "Diambil" };
    };
  };

  /// Bentuk ringkasan dari sebuah tiket.
  public func toSummary(ticket : Ticket) : TicketSummary {
    {
      id = ticket.id;
      ticketNumber = ticket.ticketNumber;
      customerName = ticket.customerName;
      customerPhone = ticket.customerPhone;
      deviceBrand = ticket.device.brand;
      deviceModel = ticket.device.model;
      imei = ticket.device.imei;
      status = ticket.status;
      estimatedCost = ticket.estimatedCost;
      estimatedCompletionDate = ticket.estimatedCompletionDate;
      createdAt = ticket.createdAt;
      updatedAt = ticket.updatedAt;
    };
  };

  /// Apakah tiket cocok dengan filter pencarian/status.
  public func matchesFilter(ticket : Ticket, filter : TicketFilter) : Bool {
    let statusOk = switch (filter.status) {
      case (?s) { ticket.status == s };
      case null { true };
    };
    if (not statusOk) { return false };
    switch (filter.search) {
      case (?raw) {
        let term = raw.toLower();
        if (term == "") { return true };
        let inName = ticket.customerName.toLower().contains(#text term);
        let inPhone = ticket.customerPhone.toLower().contains(#text term);
        let inImei = ticket.device.imei.toLower().contains(#text term);
        let inNumber = ticket.ticketNumber.toLower().contains(#text term);
        inName or inPhone or inImei or inNumber;
      };
      case null { true };
    };
  };
};
