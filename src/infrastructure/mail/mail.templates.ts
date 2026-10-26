const esc = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        c
      ] as string,
  );

const layout = (title: string, body: string) => `<!doctype html>
<html><body style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:24px;color:#222">
  <h2>${esc(title)}</h2>${body}
  <hr style="margin-top:32px"><small style="color:#888">Email tự động từ Nest Base, vui lòng không trả lời.</small>
</body></html>`;

export const templates = {
  welcome: (d: { fullName: string }) => ({
    subject: 'Chào mừng bạn đến với Nest Base',
    html: layout(
      `Xin chào ${d.fullName}!`,
      '<p>Tài khoản của bạn đã được tạo thành công.</p>',
    ),
    text: `Xin chào ${d.fullName}! Tài khoản của bạn đã được tạo thành công.`,
  }),

  passwordReset: (d: { fullName: string; link: string; minutes: number }) => ({
    subject: 'Đặt lại mật khẩu',
    html: layout(
      `Xin chào ${d.fullName}`,
      `<p>Bấm nút dưới đây để đặt lại mật khẩu. Link có hiệu lực trong <b>${d.minutes} phút</b>.</p>
       <p><a href="${esc(d.link)}" style="background:#2563eb;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">Đặt lại mật khẩu</a></p>
       <p>Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>`,
    ),
    text: `Đặt lại mật khẩu (hiệu lực ${d.minutes} phút): ${d.link}`,
  }),
};

export type TemplateName = keyof typeof templates;
export type TemplateData<N extends TemplateName> = Parameters<
  (typeof templates)[N]
>[0];
