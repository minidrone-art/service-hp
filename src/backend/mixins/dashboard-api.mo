import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import AccessControl "mo:caffeineai-authorization/access-control";
import Types "../types/dashboard";
import TicketTypes "../types/tickets";
import DashboardLib "../lib/dashboard";

mixin (
  accessControlState : AccessControl.AccessControlState,
  tickets : Map.Map<Nat, TicketTypes.Ticket>,
) {
  func requireAdminDashboard(caller : Principal) : Bool {
    if (caller.isAnonymous()) { return false };
    switch (accessControlState.userRoles.get(caller)) {
      case (?role) { role == #admin };
      case (null) { false };
    };
  };

  /// Ringkasan dashboard: jumlah per status, tiket perlu perhatian, total pendapatan (admin).
  public query ({ caller }) func getDashboardSummary() : async Types.DashboardSummary {
    if (not requireAdminDashboard(caller)) {
      return {
        counts = { diterima = 0; diagnosa = 0; menungguSparepart = 0; dikerjakan = 0; selesai = 0; diambil = 0 };
        attention = [];
        totalRevenue = 0;
      };
    };
    let all = tickets.values().toArray();
    {
      counts = DashboardLib.countByStatus(all);
      attention = DashboardLib.attentionTickets(all, Time.now().toNat());
      totalRevenue = DashboardLib.totalRevenue(all);
    };
  };
};
