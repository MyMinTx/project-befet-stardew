import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HeartTracker from './HeartTracker';

test('ยังไม่เปลี่ยนค่า ปุ่มบันทึกต้องกดไม่ได้ และที่ 0 ปุ่มลดต้องกดไม่ได้', () => {
  render(<HeartTracker initial={0} max={10} onSave={jest.fn()} />);

  expect(screen.getByRole('button', { name: 'บันทึก' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'ลดหัวใจ' })).toBeDisabled();
});

test('กด + จนถึงค่าสูงสุด ปุ่ม + ต้องกดไม่ได้ และเกินค่าสูงสุดไม่ได้', async () => {
  const user = userEvent.setup();
  render(<HeartTracker initial={9} max={10} onSave={jest.fn()} />);
  const plus = screen.getByRole('button', { name: 'เพิ่มหัวใจ' });

  await user.click(plus);

  expect(screen.getByText('10 / 10 ❤️')).toBeInTheDocument();
  expect(plus).toBeDisabled();
});

test('กดบันทึก ต้องเรียก onSave ด้วยจำนวนหัวใจใหม่ แล้วขึ้น "บันทึกแล้ว"', async () => {
  const user = userEvent.setup();
  const onSave = jest.fn().mockResolvedValue();
  render(<HeartTracker initial={6} max={14} onSave={onSave} />);

  await user.click(screen.getByRole('button', { name: 'เพิ่มหัวใจ' }));
  await user.click(screen.getByRole('button', { name: 'เพิ่มหัวใจ' }));
  await user.click(screen.getByRole('button', { name: 'บันทึก' }));

  expect(onSave).toHaveBeenCalledWith(8);
  expect(await screen.findByText('บันทึกแล้ว ✓')).toBeInTheDocument();
});

test('server ตอบ error ต้องแสดงข้อความ', async () => {
  const user = userEvent.setup();
  const onSave = jest.fn().mockRejectedValue(new Error('จำนวนหัวใจต้องอยู่ระหว่าง 0–14'));
  render(<HeartTracker initial={3} max={14} onSave={onSave} />);

  await user.click(screen.getByRole('button', { name: 'ลดหัวใจ' }));
  await user.click(screen.getByRole('button', { name: 'บันทึก' }));

  expect(await screen.findByRole('alert')).toHaveTextContent('จำนวนหัวใจต้องอยู่ระหว่าง 0–14');
});
