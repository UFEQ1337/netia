package pl.netia.tests.ttapi;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;

@SpringBootTest
@Import(PostgreSqlContainerConfiguration.class)
class TtapiApplicationTests {

	@Test
	void contextLoads() {
	}

}
