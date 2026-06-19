package pl.netia.tests.ttapi.service;

public record CreateResult<T>(T body, boolean created) {}
