import Result "mo:core/Result";
import Map "mo:core/Map";
import Time "mo:core/Time";
import AccessControl "mo:caffeineai-authorization/access-control";
import Common "../types/common";
import Types "../types/customers";
import TicketTypes "../types/tickets";
import CustomersLib "../lib/customers";
import TicketsLib "../lib/tickets";

mixin (
  accessControlState : AccessControl.AccessControlState,
  tickets : Map.Map<Nat, TicketTypes.Ticket>,
  customers : Map.Map<Nat, Types.Customer>,
  devices : Map.Map<Nat, Types.CustomerDevice>,
  counters : { var nextTicketId : Nat; var nextCustomerId : Nat; var nextDeviceId : Nat },
) {
  func requireAdminCustomer(caller : Principal) : Bool {
    if (caller.isAnonymous()) { return false };
    switch (accessControlState.userRoles.get(caller)) {
      case (?role) { role == #admin };
      case (null) { false };
    };
  };

  /// Daftar pelanggan dengan pencarian nama atau nomor HP (admin).
  /// Pencarian kosong mengembalikan seluruh pelanggan.
  public query ({ caller }) func listCustomers(search : Text) : async [Types.Customer] {
    if (not requireAdminCustomer(caller)) { return [] };
    let all = customers.values().toArray();
    if (search == "") { return all };
    all.filter(func c = CustomersLib.matchesSearch(c, search));
  };

  /// Profil pelanggan beserta perangkat dan riwayat servisnya (admin).
  public query ({ caller }) func getCustomerProfile(id : Common.CustomerId) : async ?Types.CustomerProfile {
    if (not requireAdminCustomer(caller)) { return null };
    switch (customers.get(id)) {
      case null { null };
      case (?customer) {
        let customerDevices = devices.values().toArray().filter(func d = d.customerId == id);
        let ticketIds = tickets.values().toArray()
          .filter(func t = t.customerId == id)
          .map(func t = t.id);
        ?CustomersLib.toProfile(customer, customerDevices, ticketIds);
      };
    };
  };

  /// Buat pelanggan baru (admin).
  public shared ({ caller }) func createCustomer(input : Types.CreateCustomerInput) : async Result.Result<Types.Customer, Types.CustomerError> {
    if (not requireAdminCustomer(caller)) { return #err(#unauthorized) };
    let id = counters.nextCustomerId;
    counters.nextCustomerId := id + 1;
    let customer : Types.Customer = {
      id;
      name = input.name;
      phone = input.phone;
      email = input.email;
      address = input.address;
      createdAt = Time.now().toNat();
    };
    customers.add(id, customer);
    #ok(customer);
  };

  /// Perbarui data pelanggan (admin).
  public shared ({ caller }) func updateCustomer(id : Common.CustomerId, input : Types.UpdateCustomerInput) : async Result.Result<Types.Customer, Types.CustomerError> {
    if (not requireAdminCustomer(caller)) { return #err(#unauthorized) };
    switch (customers.get(id)) {
      case null { #err(#notFound(id)) };
      case (?customer) {
        let updated : Types.Customer = {
          id = customer.id;
          name = input.name ?? customer.name;
          phone = input.phone ?? customer.phone;
          email = switch (input.email) { case (?e) ?e; case null customer.email };
          address = switch (input.address) { case (?a) ?a; case null customer.address };
          createdAt = customer.createdAt;
        };
        customers.add(id, updated);
        #ok(updated);
      };
    };
  };

  /// Riwayat perbaikan perangkat berdasarkan IMEI/serial (admin).
  public query ({ caller }) func getDeviceHistory(imei : Text) : async [Types.DeviceServiceHistoryEntry] {
    if (not requireAdminCustomer(caller)) { return [] };
    let q = imei.toLower();
    tickets.values().toArray()
      .filter(func t = t.device.imei.toLower() == q)
      .map(func t = {
        ticketId = t.id;
        ticketNumber = t.ticketNumber;
        complaint = t.complaint;
        status = TicketsLib.statusLabel(t.status);
        createdAt = t.createdAt;
      });
  };
};
