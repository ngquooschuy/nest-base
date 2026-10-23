Step 1: checking environment

```bash
node -v
git --version
pnpm -v
```

Step 2: installing Nest CLI

```bash
pnpm add -g @nestjs/cli
nest --version
```

Step 3: Creating project

```bash
nest new nest-base --package-manager pnpm --strict //Cờ --strict bật TypeScript strict mode ngay từ đầu
cd nest-base
```

Luồng của 1 request:
Trình duyệt ──GET /──▶ AppController.getHello() ──▶ AppService.getHello() ──▶ "Hello World!"

Note:

1. Module, Controller, Service trong nestjs tương ứng với Module, Component và Service trong angular, và DI hoạt động tương tự
2. Controller dùng decorator (@Get, @Post,...) để gắn hàm xử lý với 1 URL.
3. Hàm trả về object thì nest tự trả về JSON.
