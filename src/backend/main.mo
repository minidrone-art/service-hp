import Map "mo:core/Map";
import Nat "mo:core/Nat";
import AccessControl "mo:caffeineai-authorization/access-control";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import Expose "mo:caffeineai-oql/Expose";
import Entity "mo:caffeineai-oql/Entity";
import MapEntity "mo:caffeineai-oql/MapEntity";
import RecordValue "mo:caffeineai-oql/RecordValue";
import NatValue "mo:caffeineai-oql/NatValue";
import TextValue "mo:caffeineai-oql/TextValue";
import TicketsApi "mixins/tickets-api";
import CustomersApi "mixins/customers-api";
import DashboardApi "mixins/dashboard-api";
import ApiDocMixin "mixins/api-doc";
import TicketsLib "lib/tickets";
import TicketTypes "types/tickets";
import CustomerTypes "types/customers";

actor {
  let accessControlState : AccessControl.AccessControlState;
  let tickets : Map.Map<Nat, TicketTypes.Ticket>;
  let customers : Map.Map<Nat, CustomerTypes.Customer>;
  let devices : Map.Map<Nat, CustomerTypes.CustomerDevice>;
  let counters : { var nextTicketId : Nat; var nextCustomerId : Nat; var nextDeviceId : Nat };

  include MixinAuthorization(accessControlState, null);

  include TicketsApi(accessControlState, tickets, customers, devices, counters);
  include CustomersApi(accessControlState, tickets, customers, devices, counters);
  include DashboardApi(accessControlState, tickets);

  include ApiDocMixin();

  include Expose({
    entities = [
      // Tiket: record bersarang (device), array (accessories), dan variant (status)
      // → mode manual dengan payload/flatten.
      tickets.toEntityManual("ticket", "Ticket", "id")
        .sample({
          id = 0;
          ticketNumber = "";
          customerId = 0;
          customerName = "";
          customerPhone = "";
          device = { id = 0; brand = ""; model = ""; color = ""; imei = ""; accessories = [] };
          complaint = "";
          accessories = [];
          estimatedCost = 0;
          estimatedCompletionDate = 0;
          status = #diterima;
          statusHistory = [];
          technicianNotes = [];
          createdAt = 0;
          updatedAt = 0;
        })
        .payload("id", func t = t.id)
        .payload("ticketNumber", func t = t.ticketNumber)
        .payload("customerId", func t = t.customerId)
        .payload("customerName", func t = t.customerName)
        .payload("customerPhone", func t = t.customerPhone)
        .payload("deviceId", func t = t.device.id)
        .payload("deviceBrand", func t = t.device.brand)
        .payload("deviceModel", func t = t.device.model)
        .payload("deviceColor", func t = t.device.color)
        .payload("imei", func t = t.device.imei)
        .payload("deviceAccessories", func t = t.device.accessories.values().join(", "))
        .payload("complaint", func t = t.complaint)
        .payload("accessories", func t = t.accessories.values().join(", "))
        .payload("estimatedCost", func t = t.estimatedCost)
        .payload("estimatedCompletionDate", func t = t.estimatedCompletionDate)
        .payload("status", func t = TicketsLib.statusLabel(t.status))
        .payload("statusHistoryCount", func t = t.statusHistory.size())
        .payload("technicianNotesCount", func t = t.technicianNotes.size())
        .payload("createdAt", func t = t.createdAt)
        .payload("updatedAt", func t = t.updatedAt)
        .edge("customerId", "customer")
        .controllerOnly()
        .build(),
      // Pelanggan: seluruh field primitif / opsional → auto-derive.
      customers.toEntity("customer", "Customer", "id")
        .sample({ id = 0; name = ""; phone = ""; email = ?""; address = ?""; createdAt = 0 })
        .controllerOnly()
        .build(),
      // Perangkat: seluruh field primitif → auto-derive.
      devices.toEntity("device", "CustomerDevice", "id")
        .sample({ id = 0; customerId = 0; brand = ""; model = ""; color = ""; imei = ""; createdAt = 0 })
        .edge("customerId", "customer")
        .controllerOnly()
        .build(),
    ];
  });
};
