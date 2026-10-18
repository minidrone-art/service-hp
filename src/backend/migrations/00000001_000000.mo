import Map "mo:core/Map";
import AccessControl "mo:caffeineai-authorization/access-control";

module {
  type TicketStatus = {
    #diterima;
    #diagnosa;
    #menungguSparepart;
    #dikerjakan;
    #selesai;
    #diambil;
  };

  type StatusHistoryEntry = {
    status : TicketStatus;
    timestamp : Nat;
    note : Text;
  };

  type TechnicianNote = {
    timestamp : Nat;
    note : Text;
  };

  type Device = {
    id : Nat;
    brand : Text;
    model : Text;
    color : Text;
    imei : Text;
    accessories : [Text];
  };

  type Ticket = {
    id : Nat;
    ticketNumber : Text;
    customerId : Nat;
    customerName : Text;
    customerPhone : Text;
    device : Device;
    complaint : Text;
    accessories : [Text];
    estimatedCost : Nat;
    estimatedCompletionDate : Nat;
    status : TicketStatus;
    statusHistory : [StatusHistoryEntry];
    technicianNotes : [TechnicianNote];
    createdAt : Nat;
    updatedAt : Nat;
  };

  type Customer = {
    id : Nat;
    name : Text;
    phone : Text;
    email : ?Text;
    address : ?Text;
    createdAt : Nat;
  };

  type CustomerDevice = {
    id : Nat;
    customerId : Nat;
    brand : Text;
    model : Text;
    color : Text;
    imei : Text;
    createdAt : Nat;
  };

  type OldActor = {};

  type NewActor = {
    accessControlState : AccessControl.AccessControlState;
    tickets : Map.Map<Nat, Ticket>;
    customers : Map.Map<Nat, Customer>;
    devices : Map.Map<Nat, CustomerDevice>;
    counters : { var nextTicketId : Nat; var nextCustomerId : Nat; var nextDeviceId : Nat };
  };

  public func migration(_ : OldActor) : NewActor {
    {
      accessControlState = AccessControl.initState();
      tickets = Map.empty();
      customers = Map.empty();
      devices = Map.empty();
      counters = { var nextTicketId = 1; var nextCustomerId = 1; var nextDeviceId = 1 };
    };
  };
};
