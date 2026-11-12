import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CommentForm from './CommentForm';

test('ข้อความสั้นกว่า 10 ตัวอักษร ปุ่มส่งต้องกดไม่ได้', async () => {
  const user = userEvent.setup();
  render(<CommentForm onSubmit={jest.fn()} />);

  await user.type(screen.getByLabelText('แสดงความคิดเห็น'), 'สั้นไป');

  expect(screen.getByRole('button', { name: 'ส่งความคิดเห็น' })).toBeDisabled();
});

test('พิมพ์ครบแล้วกดส่ง ต้องเรียก onSubmit ด้วยข้อความ แล้วล้างช่อง', async () => {
  const user = userEvent.setup();
  const onSubmit = jest.fn().mockResolvedValue();
  render(<CommentForm onSubmit={onSubmit} />);
  const box = screen.getByLabelText('แสดงความคิดเห็น');

  await user.type(box, 'ไกด์นี้ช่วยได้มากครับ');
  await user.click(screen.getByRole('button', { name: 'ส่งความคิดเห็น' }));

  expect(onSubmit).toHaveBeenCalledWith('ไกด์นี้ช่วยได้มากครับ');
  expect(box).toHaveValue('');
});

test('ถ้า onSubmit โยน Error ต้องแสดงข้อความ และข้อความที่พิมพ์ยังอยู่', async () => {
  const user = userEvent.setup();
  const onSubmit = jest.fn().mockRejectedValue(new Error('กรุณาเข้าสู่ระบบก่อน'));
  render(<CommentForm onSubmit={onSubmit} />);
  const box = screen.getByLabelText('แสดงความคิดเห็น');

  await user.type(box, 'ไกด์นี้ช่วยได้มากครับ');
  await user.click(screen.getByRole('button', { name: 'ส่งความคิดเห็น' }));

  expect(await screen.findByRole('alert')).toHaveTextContent('กรุณาเข้าสู่ระบบก่อน');
  expect(box).toHaveValue('ไกด์นี้ช่วยได้มากครับ');
});
