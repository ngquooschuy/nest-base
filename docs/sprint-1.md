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

Module, Controller, Service trong nestjs tương ứng với Module, Component và Service trong angular, và DI hoạt động tương tự
Controller dùng decorator (@Get, @Post,...) để gắn hàm xử lý với 1 URL.
Hàm trả về object thì nest tự trả về JSON.

Path alias cần khai báo ở 2 nơi: tsconfig cho TypeScript và moduleNameMapper cho Jest.
URL chuẩn có dạng /api/v{n}/resource, và versioning giúp đổi API mà không làm hỏng client cũ.
CORS do trình duyệt thực thi, còn server chỉ khai báo danh sách được phép. Graceful shutdown là bắt SIGTERM để dọn dẹp trước khi tắt.

So sánh configService.get('APP_NAME') với @Inject(appConfig.KEY): cách nào an toàn hơn, và vì sao?
=> @Inject(appConfig.KEY) an toàn hơn khi dùng cấu hình theo namespace trong NestJS.

configService.get('APP_NAME'): Dùng key dạng chuỗi, dễ sai tên key và khó kiểm tra kiểu dữ liệu tại compile time.

@Inject(appConfig.KEY): Gắn với namespace đã đăng ký bằng registerAs(), kết hợp ConfigType<typeof appConfig> giúp kiểm tra kiểu dữ liệu tốt hơn và giảm lỗi khi refactor.

Khuyến nghị: Dùng @Inject(appConfig.KEY) kết hợp ConfigType<typeof appConfig> để đảm bảo type safety.
