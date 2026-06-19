package pl.netia.tests.ttapi.service;

import org.springframework.stereotype.Component;

@Component
public class ParityTicketStatusResolver implements TicketStatusResolver {

    @Override
    public String resolveInitialStatus(long serviceId) {
        return serviceId % 2 == 0 ? "acknowledged" : "rejected";
    }
}
