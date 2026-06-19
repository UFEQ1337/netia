package pl.netia.tests.ttapi.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;
import pl.netia.tests.ttapi.entity.TroubleTicketEntity;
import pl.netia.tests.ttapi.entity.TroubleTicketNoteEntity;
import pl.netia.tests.ttapi.model.NoteDto;
import pl.netia.tests.ttapi.model.TroubleTicketDto;
import pl.netia.tests.ttapi.model.TroubleTicketStatusDto;
import pl.netia.tests.ttapi.model.TroubleTicketSummaryDto;

@Mapper
public interface TroubleTicketMapper {

    @Mapping(target = "status", source = "status", qualifiedByName = "statusFromString")
    TroubleTicketDto toDto(TroubleTicketEntity entity);

    @Mapping(target = "status", source = "status", qualifiedByName = "statusFromString")
    TroubleTicketSummaryDto toSummaryDto(TroubleTicketEntity entity);

    @Mapping(target = "id", expression = "java(entity.getId().toString())")
    @Mapping(target = "text", source = "note")
    @Mapping(target = "date", source = "createdAt")
    NoteDto toNoteDto(TroubleTicketNoteEntity entity);

    @Named("statusFromString")
    default TroubleTicketStatusDto statusFromString(String status) {
        return TroubleTicketStatusDto.fromValue(status);
    }
}
