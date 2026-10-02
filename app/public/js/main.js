// Script xử lý tương tác Client
document.addEventListener('DOMContentLoaded', () => {
  // Xác nhận trước khi xóa trong CMS
  const deleteForms = document.querySelectorAll('form[action*="/delete"]');
  deleteForms.forEach(form => {
    form.addEventListener('submit', (e) => {
      if (!confirm('Bạn có chắc chắn muốn xóa mục này? Hành động không thể hoàn tác.')) {
        e.preventDefault();
      }
    });
  });

  // Tự động ẩn thông báo flash sau 4 giây
  const alertBoxes = document.querySelectorAll('.alert-auto-dismiss');
  if (alertBoxes.length > 0) {
    setTimeout(() => {
      alertBoxes.forEach(alert => {
        alert.style.transition = 'opacity 0.5s ease';
        alert.style.opacity = '0';
        setTimeout(() => alert.remove(), 500);
      });
    }, 4000);
  }
});
