import {
  type CreateCustomerInput,
  type CreateTicketInput,
  type TicketFilter,
  type TicketId,
  type TicketStatus,
  type UpdateCustomerInput,
  type UpdateTicketInput,
  createActor,
} from "@/backend";
import { queryKeys } from "@/lib/queryKeys";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/* ------------------------------------------------------------------ queries */

export function useDashboardSummary() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: async () => {
      if (!actor) return null;
      return actor.getDashboardSummary();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useTickets(filter: TicketFilter) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: queryKeys.tickets(filter),
    queryFn: async () => {
      if (!actor) return [];
      return actor.listTickets(filter);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useTicket(id: TicketId | null) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: queryKeys.ticket(id ?? 0n),
    queryFn: async () => {
      if (!actor || id === null) return null;
      return actor.getTicket(id);
    },
    enabled: !!actor && !isFetching && id !== null,
  });
}

export function useCustomers(search: string) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: queryKeys.customers(search),
    queryFn: async () => {
      if (!actor) return [];
      return actor.listCustomers(search.trim());
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCustomerProfile(id: bigint | null) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: queryKeys.customerProfile(id ?? 0n),
    queryFn: async () => {
      if (!actor || id === null) return null;
      return actor.getCustomerProfile(id);
    },
    enabled: !!actor && !isFetching && id !== null,
  });
}

export function useDeviceHistory(imei: string) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: queryKeys.deviceHistory(imei),
    queryFn: async () => {
      if (!actor || imei.trim() === "") return [];
      return actor.getDeviceHistory(imei.trim());
    },
    enabled: !!actor && !isFetching && imei.trim() !== "",
  });
}

/* ---------------------------------------------------------------- mutations */

function useInvalidateAll() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: ["tickets"] });
    void queryClient.invalidateQueries({ queryKey: ["ticket"] });
    void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    void queryClient.invalidateQueries({ queryKey: ["customers"] });
    void queryClient.invalidateQueries({ queryKey: ["customerProfile"] });
    void queryClient.invalidateQueries({ queryKey: ["deviceHistory"] });
  };
}

export function useCreateTicket() {
  const { actor } = useActor(createActor);
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: async (input: CreateTicketInput) => {
      if (!actor) throw new Error("Backend belum siap");
      return actor.createTicket(input);
    },
    onSuccess: () => {
      invalidate();
    },
  });
}

export function useUpdateTicket() {
  const { actor } = useActor(createActor);
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: { id: TicketId; input: UpdateTicketInput }) => {
      if (!actor) throw new Error("Backend belum siap");
      return actor.updateTicket(id, input);
    },
    onSuccess: () => {
      invalidate();
    },
  });
}

export function useDeleteTicket() {
  const { actor } = useActor(createActor);
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: async (id: TicketId) => {
      if (!actor) throw new Error("Backend belum siap");
      return actor.deleteTicket(id);
    },
    onSuccess: () => {
      invalidate();
    },
  });
}

export function useChangeTicketStatus() {
  const { actor } = useActor(createActor);
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: async ({
      id,
      status,
      note,
    }: {
      id: TicketId;
      status: TicketStatus;
      note: string;
    }) => {
      if (!actor) throw new Error("Backend belum siap");
      return actor.changeTicketStatus(id, status, note);
    },
    onSuccess: () => {
      invalidate();
    },
  });
}

export function useAddTechnicianNote() {
  const { actor } = useActor(createActor);
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: async ({ id, note }: { id: TicketId; note: string }) => {
      if (!actor) throw new Error("Backend belum siap");
      return actor.addTechnicianNote(id, note);
    },
    onSuccess: () => {
      invalidate();
    },
  });
}

export function useCreateCustomer() {
  const { actor } = useActor(createActor);
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: async (input: CreateCustomerInput) => {
      if (!actor) throw new Error("Backend belum siap");
      return actor.createCustomer(input);
    },
    onSuccess: () => {
      invalidate();
    },
  });
}

export function useUpdateCustomer() {
  const { actor } = useActor(createActor);
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: { id: bigint; input: UpdateCustomerInput }) => {
      if (!actor) throw new Error("Backend belum siap");
      return actor.updateCustomer(id, input);
    },
    onSuccess: () => {
      invalidate();
    },
  });
}
