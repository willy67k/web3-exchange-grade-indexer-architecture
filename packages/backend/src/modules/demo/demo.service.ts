import { Injectable } from "@nestjs/common";

@Injectable()
export class DemoService {
  getHello() {
    return {
      message: "Demo says hello.",
    };
  }
}
