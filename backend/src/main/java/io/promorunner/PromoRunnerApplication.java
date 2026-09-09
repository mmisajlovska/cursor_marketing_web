package io.promorunner;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.data.redis.RedisAutoConfiguration;
import org.springframework.boot.autoconfigure.data.redis.RedisReactiveAutoConfiguration;
import org.springframework.boot.autoconfigure.data.redis.RedisRepositoriesAutoConfiguration;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication(
    exclude = {
      RedisAutoConfiguration.class,
      RedisReactiveAutoConfiguration.class,
      RedisRepositoriesAutoConfiguration.class,
      UserDetailsServiceAutoConfiguration.class
    })
@ConfigurationPropertiesScan
public class PromoRunnerApplication {

  public static void main(String[] args) {
    SpringApplication.run(PromoRunnerApplication.class, args);
  }
}
