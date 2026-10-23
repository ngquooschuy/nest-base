# Sprint 1: Khởi tạo Dự án & Chuẩn hóa Nền tảng NestJS (Foundation & Code Quality)

Tài liệu đúc kết toàn bộ kiến thức lý thuyết, kỹ thuật cốt lõi và các bước thực hành đã hoàn thiện trong **Sprint 1**.

---

## 📌 Tổng quan mục tiêu Sprint 1
Xây dựng khung dự án (starter base) NestJS đạt chuẩn production với:
- Strict TypeScript Mode từ đầu.
- Bộ công cụ kiểm soát chất lượng mã nguồn tự động (Oxlint + Prettier + Husky + Commitlint).
- Hệ thống cấu hình đa tầng (Zod Schema Validation + Namespace Config + Type-safe DI).
- Module path aliases đồng bộ giữa TypeScript và Jest.
- Chuẩn hóa API RESTful (Global prefix, URI Versioning, CORS).
- Cơ chế Graceful Shutdown cho môi trường Cloud/Container.

---

## 1. Khởi tạo Dự án & Luồng Request Cốt lõi

### Khởi tạo môi trường
```bash
# Kiểm tra phiên bản môi trường
node -v   # >= 20
pnpm -v   # >= 9
nest --version

# Khởi tạo dự án với Strict Mode
nest new nest-base --package-manager pnpm --strict
cd nest-base
```
*Cờ `--strict` kích hoạt toàn bộ các kiểm tra nghiêm ngặt nhất của TypeScript (`strictNullChecks`, `noImplicitAny`, v.v.), giúp giảm thiểu lỗi runtime.*

### Luồng xử lý một Request trong NestJS
```text
Client / Trình duyệt
       │ (HTTP GET /api/v1)
       ▼
 ┌─────────────┐
 │ Controller  │  (@Controller, @Get) Tiếp nhận request, routing, parse param/body
 └──────┬──────┘
        │ Inject qua constructor (DI)
        ▼
 ┌─────────────┐
 │   Service   │  (@Injectable) Xử lý business logic nghiệp vụ
 └──────┬──────┘
        │ Trả về Object / Array
        ▼
   NestJS Engine  ── Tự động serialize thành JSON ──▶ Client nhận HTTP 200 OK
```

### So sánh tương quan với Angular
| Khái niệm | NestJS (Backend) | Angular (Frontend) | Vai trò |
| :--- | :--- | :--- | :--- |
| **Module** | `@Module` | `@NgModule` / Standalone | Gom cụm tính năng, quản lý phạm vi DI |
| **Controller / Component** | `@Controller` | `@Component` | Điểm đón input & điều phối giao diện/endpoint |
| **Service** | `@Injectable` | `@Injectable({ providedIn: 'root' })` | Chứa logic nghiệp vụ độc lập |
| **DI Engine** | Constructor Injection | Constructor Injection | IoC Container tự resolve dependency |

---

## 2. Chuẩn hóa Code Quality & Git Hooks

Thay thế bộ công cụ truyền thống (ESLint cồng kềnh) bằng stack hiện đại, tốc độ cao:

### Oxlint + Prettier
- **Oxlint**: Linter viết bằng Rust, tốc độ thực thi ~50ms (nhanh gấp hàng chục lần ESLint).
- Cấu hình [`.oxlintrc.json`](file:///d:/learning/nest-base/.oxlintrc.json):
  - Kích hoạt các plugin: `typescript`, `unicorn`, `oxc`, `import`.
  - Cấu hình rule NestJS thân thiện: `"typescript/no-extraneous-class": ["warn", { "allowWithDecorator": true }]` để không báo lỗi class rỗng của `@Module()`.

### Husky + Lint-staged + Commitlint
- **Pre-commit hook**: Kích hoạt `lint-staged` trên các file `.ts` đang được staged:
  1. `oxlint --fix`: Tự động sửa lỗi cú pháp & code style.
  2. `prettier --write`: Tự động định dạng (nháy đơn `singleQuote`, dấu phẩy cuối `trailingComma`).
- **Commit-msg hook**: Kích hoạt `commitlint` theo chuẩn **Conventional Commits**:
  - Format bắt buộc: `<type>: <subject>` (Ví dụ: `feat: add validated config module`, `chore: setup tools`).
  - Chặn ngay lập tức nếu commit thiếu type/subject (ví dụ commit `abc` sẽ bị reject).

---

## 3. Hệ thống Cấu hình 3 Tầng (3-Layer Type-Safe Config)

Quản lý biến môi trường an toàn, tránh hoàn toàn lỗi runtime khi thiếu biến `.env`:

```text
[.env file / Process ENV]
         │
  [Tầng 1: env.validation.ts]  ── Zod Schema validate & coerce kiểu (Fail-fast khi app start)
         │
  [Tầng 2: app.config.ts]      ── registerAs('app') phân nhóm cấu hình theo namespace
         │
  [Tầng 3: AppController / Service] ── @Inject(appConfig.KEY) + ConfigType<typeof appConfig>
```

### So sánh phương pháp truy xuất cấu hình
| Tiêu chí | `configService.get('APP_NAME')` | `@Inject(appConfig.KEY)` + `ConfigType` (Khuyên dùng) |
| :--- | :--- | :--- |
| **Kiểu dữ liệu** | Phải ép kiểu thủ công (`get<string>`) | Tự động suy luận kiểu 100% từ schema |
| **Rủi ro Typo** | Cao (dùng chuỗi `"APP_NAME"`, sai chữ không biết) | Bằng 0 (gợi ý IntelliSense: `config.name`, `config.port`) |
| **Refactor** | Khó tìm kiếm và đổi tên | Dễ dàng Rename Symbol toàn dự án |
| **Phân vùng** | Trộn lẫn tất cả biến trong một pool | Phân namespace rõ ràng (`app`, `database`, `jwt`, ...) |

> **Tại sao cần `z.coerce` trong Zod?**  
> Mọi giá trị đọc từ file `.env` đều mặc định là dạng `string` (ví dụ `"3000"`). `z.coerce.number()` sẽ ép kiểu chuỗi sang `number` trước khi thực hiện validate số nguyên dương.

---

## 4. Đường dẫn Rút gọn (Path Aliases) & Tương thích Jest

Tránh việc import tương đối rối rắm (`../../../../config/app.config`):

### Khai báo trong [`tsconfig.json`](file:///d:/learning/nest-base/tsconfig.json)
```json
"paths": {
  "@config/*": ["./src/config/*"],
  "@core/*": ["./src/core/*"],
  "@shared/*": ["./src/shared/*"],
  "@infra/*": ["./src/infrastructure/*"],
  "@modules/*": ["./src/modules/*"]
}
```

### Cơ chế mapping với Jest
Path alias cần được khai báo đồng bộ cho Jest để khi chạy test không bị lỗi `Cannot find module`:
1. **Unit Test ([`jest.config.ts`](file:///d:/learning/nest-base/jest.config.ts))**:  
   Dùng hàm `pathsToModuleNameMapper(paths, { prefix: '<rootDir>/' })` để đọc tự động từ `tsconfig.json`. Mọi alias mới thêm vào TypeScript sẽ tự động có hiệu lực trong Unit Test.
2. **E2E Test ([`test/jest-e2e.json`](file:///d:/learning/nest-base/test/jest-e2e.json))**:  
   Do file config là JSON tĩnh và có `rootDir: "."` (trỏ trong thư mục `test/`), ta map thủ công trỏ ngược ra `src`:
   ```json
   "moduleNameMapper": {
     "^@config/(.*)$": "<rootDir>/../src/config/$1",
     "^@core/(.*)$": "<rootDir>/../src/core/$1",
     "^@shared/(.*)$": "<rootDir>/../src/shared/$1",
     "^@infra/(.*)$": "<rootDir>/../src/infrastructure/$1",
     "^@modules/(.*)$": "<rootDir>/../src/modules/$1"
   }
   ```

---

## 5. Chuẩn hóa Bootstrap cho Production ([`src/main.ts`](file:///d:/learning/nest-base/src/main.ts))

Các thiết lập bắt buộc cho mọi API NestJS:

```typescript
// 1. Global Prefix: gom toàn bộ route dưới /api
app.setGlobalPrefix('api');

// 2. URI Versioning: URL chuẩn dạng /api/v1/ping, /api/v2/ping
app.enableVersioning({
  type: VersioningType.URI,
  defaultVersion: '1',
});

// 3. CORS: Whitelist domain client (Angular/React), cho phép credentials (cookies/auth headers)
app.enableCors({
  origin: config.corsOrigins,
  credentials: true,
});

// 4. Graceful Shutdown: Lắng nghe tín hiệu SIGTERM/SIGINT từ hệ điều hành
app.enableShutdownHooks();
```

### Các khái niệm quan trọng:
- **API Versioning**: Giúp nâng cấp logic API (ví dụ endpoint V2 trả thêm field `uptime`) mà không làm gián đoạn các ứng dụng client cũ đang dùng V1.
- **CORS (Cross-Origin Resource Sharing)**: Là chính sách bảo mật do **trình duyệt thực thi** (server-to-server không bị chặn). Server chỉ đóng vai trò khai báo response header `Access-Control-Allow-Origin` để báo cho trình duyệt biết nguồn nào được phép đọc dữ liệu.
- **Graceful Shutdown**: Khi deploy phiên bản mới trên Kubernetes/Docker, container nhận tín hiệu `SIGTERM`. `enableShutdownHooks()` giúp NestJS gọi hook `onApplicationShutdown()` để:
  - Hoàn tất các HTTP request đang dang dở.
  - Đóng an toàn kết nối Database, giải phóng Redis, ngắt Queue worker trước khi tiến trình tắt hoàn toàn.

---

## 6. Lịch sử Commit & Tag của Sprint 1

| Commit | Message | Mô tả chi tiết |
| :--- | :--- | :--- |
| `474b248` | `feat: initial project setup` | Khởi tạo dự án NestJS strict mode, setup Oxlint, Prettier, Husky, Commitlint |
| `7e06584` | `chore: setup code quality tools` | Kiểm thử thực tế tự động sửa định dạng (Prettier) & chặn commit sai chuẩn (Commitlint) |
| `4da56ee` | `chore: replace eslint with oxlint` | Chuẩn hóa `.oxlintrc.json`, cập nhật script `pnpm lint` và `lint-staged` |
| `3d245da` | `feat: add validated config module` | Tích hợp Zod validate `.env`, tạo `appConfig` namespace, inject an toàn |
| `dfc8c4f` | `feat: add path alias, api prefix, versioning, cors and graceful shutdown` | Cấu hình path alias tsconfig/jest, global prefix `api`, URI versioning, CORS, graceful shutdown |
| **Tag** | `sprint-1` | Đóng gói mốc hoàn thành Sprint 1 |
