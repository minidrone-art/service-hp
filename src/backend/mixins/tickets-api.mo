import Result "mo:core/Result";
import Map "mo:core/Map";
import Time "mo:core/Time";
import AccessControl "mo:caffeineai-authorization/access-control";
import Common "../types/common";
import Types "../types/tickets";
import CustomerTypes "../types/customers";
import TicketsLib "../lib/tickets";

mixin (
  accessControlState : AccessControl.AccessControlState,
  tickets : Map.Map<Nat, Types.Ticket>,
  customers : Map.Map<Nat, CustomerTypes.Customer>,
  devices : Map.Map<Nat, CustomerTypes.CustomerDevice>,
  counters : { var nextTicketId : Nat; var nextCustomerId : Nat; var nextDeviceId : Nat },
) {
  func requireAdmin(caller : Principal) : Bool {
    if (caller.isAnonymous()) { return false };
    switch (accessControlState.userRoles.get(caller)) {
      case (?role) { role == #admin };
      case (null) { false };
    };
  };

  func padNumber(n : Nat) : Text {
    let s = n.toText();
    if (s.size() >= 6) { s } else {
      var out = "";
      var i = s.size();
      while (i < 6) {
        out := out # "0";
        i += 1;
      };
      out # s;
    };
  };

  func findCustomerByPhone(phone : Text) : ?CustomerTypes.Customer {
    customers.values().find(func c = c.phone == phone);
  };

  /// Daftar tiket dengan pencarian dan filter status (admin).
  public query ({ caller }) func listTickets(filter : Types.TicketFilter) : async [Types.TicketSummary] {
    if (not requireAdmin(caller)) { return [] };
    let all = tickets.values().toArray();
    let matched = all.filter(func ticket = TicketsLib.matchesFilter(ticket, filter));
    matched.map(func ticket = TicketsLib.toSummary(ticket));
  };

  /// Detail lengkap sebuah tiket (admin).
  public query ({ caller }) func getTicket(id : Common.TicketId) : async ?Types.Ticket {
    if (not requireAdmin(caller)) { return null };
    tickets.get(id);
  };

  /// Buat tiket servis baru (admin).
  public shared ({ caller }) func createTicket(input : Types.CreateTicketInput) : async Result.Result<Types.Ticket, Types.TicketError> {
    if (not requireAdmin(caller)) { return #err(#unauthorized) };
    let now = Time.now().toNat();

    let customerId = switch (findCustomerByPhone(input.customerPhone)) {
      case (?existing) {
        if (existing.name != input.customerName) {
          customers.add(existing.id, { existing with name = input.customerName });
        };
        existing.id;
      };
      case null {
        let id = counters.nextCustomerId;
        counters.nextCustomerId := id + 1;
        customers.add(id, {
          id;
          name = input.customerName;
          phone = input.customerPhone;
          email = null;
          address = null;
          createdAt = now;
        });
        id;
      };
    };

    let deviceId = counters.nextDeviceId;
    counters.nextDeviceId := deviceId + 1;
    let device : Types.Device = {
      id = deviceId;
      brand = input.deviceBrand;
      model = input.deviceModel;
      color = input.deviceColor;
      imei = input.imei;
      accessories = input.accessories;
    };
    devices.add(deviceId, {
      id = deviceId;
      customerId;
      brand = input.deviceBrand;
      model = input.deviceModel;
      color = input.deviceColor;
      imei = input.imei;
      createdAt = now;
    });

    let ticketId = counters.nextTicketId;
    counters.nextTicketId := ticketId + 1;
    let ticket : Types.Ticket = {
      id = ticketId;
      ticketNumber = "TSV-" # padNumber(ticketId);
      customerId;
      customerName = input.customerName;
      customerPhone = input.customerPhone;
      device;
      complaint = input.complaint;
      accessories = input.accessories;
      estimatedCost = input.estimatedCost;
      estimatedCompletionDate = input.estimatedCompletionDate;
      status = #diterima;
      statusHistory = [{ status = #diterima; timestamp = now; note = "Tiket diterima" }];
      technicianNotes = [];
      createdAt = now;
      updatedAt = now;
    };
    tickets.add(ticketId, ticket);
    #ok(ticket);
  };

  /// Perbarui data tiket (admin). Tiket yang sudah diambil tidak dapat diubah.
  public shared ({ caller }) func updateTicket(id : Common.TicketId, input : Types.UpdateTicketInput) : async Result.Result<Types.Ticket, Types.TicketError> {
    if (not requireAdmin(caller)) { return #err(#unauthorized) };
    switch (tickets.get(id)) {
      case null { #err(#notFound(id)) };
      case (?ticket) {
        if (ticket.status == #diambil) { return #err(#alreadyPickedUp(id)) };
        let now = Time.now().toNat();
        let updated : Types.Ticket = {
          id = ticket.id;
          ticketNumber = ticket.ticketNumber;
          customerId = ticket.customerId;
          customerName = input.customerName ?? ticket.customerName;
          customerPhone = input.customerPhone ?? ticket.customerPhone;
          device = {
            id = ticket.device.id;
            brand = input.deviceBrand ?? ticket.device.brand;
            model = input.deviceModel ?? ticket.device.model;
            color = input.deviceColor ?? ticket.device.color;
            imei = input.imei ?? ticket.device.imei;
            accessories = input.accessories ?? ticket.device.accessories;
          };
          complaint = input.complaint ?? ticket.complaint;
          accessories = input.accessories ?? ticket.accessories;
          estimatedCost = input.estimatedCost ?? ticket.estimatedCost;
          estimatedCompletionDate = input.estimatedCompletionDate ?? ticket.estimatedCompletionDate;
          status = ticket.status;
          statusHistory = ticket.statusHistory;
          technicianNotes = ticket.technicianNotes;
          createdAt = ticket.createdAt;
          updatedAt = now;
        };
        tickets.add(id, updated);
        switch (devices.get(ticket.device.id)) {
          case (?device) {
            devices.add(ticket.device.id, {
              device with
              brand = updated.device.brand;
              model = updated.device.model;
              color = updated.device.color;
              imei = updated.device.imei;
            });
          };
          case null {};
        };
        #ok(updated);
      };
    };
  };

  /// Hapus tiket (admin).
  public shared ({ caller }) func deleteTicket(id : Common.TicketId) : async Result.Result<(), Types.TicketError> {
    if (not requireAdmin(caller)) { return #err(#unauthorized) };
    switch (tickets.get(id)) {
      case null { #err(#notFound(id)) };
      case (?_) {
        tickets.remove(id);
        #ok(());
      };
    };
  };

  /// Ubah status tiket mengikuti alur tahapan (admin).
  public shared ({ caller }) func changeTicketStatus(id : Common.TicketId, status : Types.TicketStatus, note : Text) : async Result.Result<Types.Ticket, Types.TicketError> {
    if (not requireAdmin(caller)) { return #err(#unauthorized) };
    switch (tickets.get(id)) {
      case null { #err(#notFound(id)) };
      case (?ticket) {
        if (ticket.status == #diambil) { return #err(#alreadyPickedUp(id)) };
        if (not TicketsLib.isValidTransition(ticket.status, status)) {
          return #err(#invalidTransition({ from = ticket.status; to = status }));
        };
        let now = Time.now().toNat();
        let entry : Types.StatusHistoryEntry = { status; timestamp = now; note };
        let updated : Types.Ticket = {
          id = ticket.id;
          ticketNumber = ticket.ticketNumber;
          customerId = ticket.customerId;
          customerName = ticket.customerName;
          customerPhone = ticket.customerPhone;
          device = ticket.device;
          complaint = ticket.complaint;
          accessories = ticket.accessories;
          estimatedCost = ticket.estimatedCost;
          estimatedCompletionDate = ticket.estimatedCompletionDate;
          status;
          statusHistory = ticket.statusHistory.concat([entry]);
          technicianNotes = ticket.technicianNotes;
          createdAt = ticket.createdAt;
          updatedAt = now;
        };
        tickets.add(id, updated);
        #ok(updated);
      };
    };
  };

  /// Tambah catatan teknisi pada tiket (admin).
  public shared ({ caller }) func addTechnicianNote(id : Common.TicketId, note : Text) : async Result.Result<Types.Ticket, Types.TicketError> {
    if (not requireAdmin(caller)) { return #err(#unauthorized) };
    switch (tickets.get(id)) {
      case null { #err(#notFound(id)) };
      case (?ticket) {
        let now = Time.now().toNat();
        let entry : Types.TechnicianNote = { timestamp = now; note };
        let updated : Types.Ticket = {
          id = ticket.id;
          ticketNumber = ticket.ticketNumber;
          customerId = ticket.customerId;
          customerName = ticket.customerName;
          customerPhone = ticket.customerPhone;
          device = ticket.device;
          complaint = ticket.complaint;
          accessories = ticket.accessories;
          estimatedCost = ticket.estimatedCost;
          estimatedCompletionDate = ticket.estimatedCompletionDate;
          status = ticket.status;
          statusHistory = ticket.statusHistory;
          technicianNotes = ticket.technicianNotes.concat([entry]);
          createdAt = ticket.createdAt;
          updatedAt = now;
        };
        tickets.add(id, updated);
        #ok(updated);
      };
    };
  };
};
