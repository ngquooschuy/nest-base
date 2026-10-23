Bức tranh tổng thể
Đây là sơ đồ cần thuộc lòng:

```text
Request → Middleware → Guard → Interceptor (trước) → Pipe → Controller
                                                              │
                         ┌──── trả về data bình thường ───────┤
                         ▼                                     │ throw lỗi ở bất kỳ đâu
        Interceptor (sau): bọc data vào { success, data }      ▼
                         │                          Exception Filter: bọc lỗi vào { success: false, error }
                         ▼                                     ▼
                      Response ◀───────────────────────────────┘
```

Điểm mấu chốt: khi có lỗi bị throw, luồng bỏ qua phần "sau" của interceptor và nhảy thẳng tới filter. Vì vậy phải dùng cả hai: interceptor lo khuôn khi thành công, filter lo khuôn khi lỗi.

Vì sao không dùng app.useGlobalFilters(new AllExceptionsFilter()) trong main.ts? Vì khi tự new, class nằm ngoài DI, nên không inject được appConfig. Đăng ký qua APP_FILTER thì Nest tự tạo instance và tự inject đầy đủ. Hãy ghi nhớ quy tắc này: global thì dùng APP_* provider.
Ghi nhớ (3 câu)
Interceptor bọc response thành công, Filter bọc response lỗi. Lỗi bỏ qua phần "sau" của interceptor.
Filter phân loại lỗi từ cụ thể đến chung: BusinessException, rồi HttpException, rồi lỗi không xác định. Ở production, không bao giờ lộ chi tiết lỗi 500.
Global filter hay interceptor thì đăng ký bằng APP_FILTER / APP_INTERCEPTOR để dùng được DI.

Ghi nhớ (3 câu)
DTO là class có decorator validate, và là tuyến phòng thủ cuối cùng: không bao giờ tin dữ liệu từ client.
Bộ ba tùy chọn cần nhớ: whitelist (lọc field lạ), forbidNonWhitelisted (báo lỗi khi có field lạ), transform (ép kiểu thành instance).
Query string luôn là chuỗi, nên ép kiểu tường minh bằng @Type(() => Number).

Ghi nhớ (3 câu)
Request ID là mã vận đơn: có mặt trong mọi dòng log, trong header x-request-id và trong body lỗi.
Log ở dev thì dễ đọc (pino-pretty), ở production là JSON. Header nhạy cảm luôn bị che bằng redact.
Dùng new Logger(Context) của Nest như bình thường. nestjs-pino tự gắn request ID nhờ AsyncLocalStorage.
