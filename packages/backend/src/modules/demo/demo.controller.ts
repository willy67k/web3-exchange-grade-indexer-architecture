import { Controller, Get } from "@nestjs/common";
import { DemoService } from "./demo.service.js";

@Controller("demo")
export class DemoController {
  constructor(private readonly demoService: DemoService) {}

  @Get()
  getHello() {
    return this.demoService.getHello();
  }
}
