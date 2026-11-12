package handlers

import (
	"testing"

	"stardew-be/models"
)

func ptr[T any](v T) *T { return &v }

func TestValidateItem(t *testing.T) {
	cases := []struct {
		name    string
		in      models.ItemInput
		wantErr bool
	}{
		{"ถูกต้อง", models.ItemInput{Name: "Parsnip", Category: "crop", SellPrice: 35, Seasons: []string{"spring"}}, false},
		{"ชื่อว่าง", models.ItemInput{Name: "   ", Category: "crop"}, true},
		{"หมวดผิด", models.ItemInput{Name: "Sword", Category: "weapon"}, true},
		{"ฤดูผิด", models.ItemInput{Name: "X", Category: "crop", Seasons: []string{"autumn"}}, true},
		{"ราคาติดลบ", models.ItemInput{Name: "X", Category: "crop", SellPrice: -1}, true},
		{"ลิงก์รูปอันตราย", models.ItemInput{Name: "X", Category: "crop", ImageURL: ptr("javascript:alert(1)")}, true},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			in := c.in
			msg := validateItem(&in)
			if (msg != "") != c.wantErr {
				t.Errorf("wantErr=%v แต่ได้ข้อความ %q", c.wantErr, msg)
			}
		})
	}
}

// validateItem ต้องทำความสะอาดข้อมูลด้วย: ตัดช่องว่าง, "" → nil, ตัดฤดูซ้ำ, nil → []
func TestValidateItemCleansInput(t *testing.T) {
	in := models.ItemInput{
		Name:        "  Blueberry  ",
		Category:    "crop",
		Description: ptr("   "),
		Seasons:     []string{"summer", "summer"},
	}
	if msg := validateItem(&in); msg != "" {
		t.Fatalf("ไม่ควรมี error: %s", msg)
	}
	if in.Name != "Blueberry" {
		t.Errorf("ชื่อต้องถูกตัดช่องว่าง ได้ %q", in.Name)
	}
	if in.Description != nil {
		t.Error("description ที่เป็นช่องว่างต้องกลายเป็น nil")
	}
	if len(in.Seasons) != 1 {
		t.Errorf("ฤดูซ้ำต้องถูกตัด ได้ %v", in.Seasons)
	}

	empty := models.ItemInput{Name: "Stone", Category: "resource"}
	validateItem(&empty)
	if empty.Seasons == nil {
		t.Error("seasons ต้องเป็น [] ไม่ใช่ nil (คอลัมน์ใน DB เป็น NOT NULL)")
	}
}

func TestValidateNpcBirthday(t *testing.T) {
	cases := []struct {
		name    string
		season  *string
		day     *int16
		wantErr bool
	}{
		{"มีครบคู่", ptr("fall"), ptr(int16(13)), false},
		{"ไม่มีทั้งคู่", nil, nil, false},
		{"มีแต่ฤดู", ptr("fall"), nil, true},
		{"มีแต่วัน", nil, ptr(int16(13)), true},
		{"วันที่ 29", ptr("fall"), ptr(int16(29)), true},
		{"ฤดูผิด", ptr("autumn"), ptr(int16(1)), true},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			in := models.NpcInput{Name: "Abigail", BirthdaySeason: c.season, BirthdayDay: c.day}
			if msg := validateNpc(&in); (msg != "") != c.wantErr {
				t.Errorf("wantErr=%v แต่ได้ข้อความ %q", c.wantErr, msg)
			}
		})
	}
}

func TestValidatePassword(t *testing.T) {
	cases := map[string]bool{ // รหัส → ต้องผ่านไหม
		"1234567":                false, // 7 ตัว
		"12345678":               true,  // 8 ตัว
		"รหัสผ่านไทย8":           true,  // นับเป็นตัวอักษร ไม่ใช่ไบต์
		string(make([]byte, 73)): false, // เกิน 72 ไบต์ (bcrypt รับไม่ได้)
	}
	for pw, wantOK := range cases {
		if ok := validatePassword(pw) == ""; ok != wantOK {
			t.Errorf("รหัสยาว %d ไบต์: ได้ ok=%v ต้องการ %v", len(pw), ok, wantOK)
		}
	}
}
