import Common "../types/common";
import Types "../types/customers";

module {
  public type CustomerId = Common.CustomerId;
  public type Customer = Types.Customer;
  public type CustomerDevice = Types.CustomerDevice;
  public type CustomerProfile = Types.CustomerProfile;
  public type CreateCustomerInput = Types.CreateCustomerInput;
  public type UpdateCustomerInput = Types.UpdateCustomerInput;

  /// Apakah pelanggan cocok dengan istilah pencarian (nama atau nomor HP).
  public func matchesSearch(customer : Customer, term : Text) : Bool {
    let q = term.toLower();
    if (q == "") { return true };
    customer.name.toLower().contains(#text q) or customer.phone.toLower().contains(#text q);
  };

  /// Bentuk profil pelanggan dari data mentah.
  public func toProfile(
    customer : Customer,
    devices : [CustomerDevice],
    tickets : [Common.TicketId],
  ) : CustomerProfile {
    { customer; devices; tickets };
  };
};
