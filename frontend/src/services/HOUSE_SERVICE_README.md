# 📚 API Service Documentation

## HouseService

File: `src/services/houseService.js`

### Các Hàm

#### `getAllHouses()`
Lấy danh sách tất cả nhà của user hiện tại

**Returns:** Array of House objects

**Example:**
```javascript
const houses = await getAllHouses();
console.log(houses); // [{ _id, name, address, members, ... }]
```

---

#### `createHouse(houseData)`
Tạo nhà mới

**Parameters:**
- `houseData` (Object):
  - `name` (String, required): Tên nhà
  - `address` (String, optional): Địa chỉ

**Returns:** House object

**Example:**
```javascript
const newHouse = await createHouse({
  name: 'Nhà Bình Thạnh',
  address: '123 Đường ABC, TP.HCM'
});
```

---

#### `getHouseById(houseId)`
Lấy chi tiết của một nhà

**Parameters:**
- `houseId` (String): ID của nhà

**Returns:** House object

**Example:**
```javascript
const house = await getHouseById('60d5ec49c1234567890abcd');
```

---

#### `updateHouse(houseId, houseData)`
Cập nhật thông tin nhà

**Parameters:**
- `houseId` (String): ID của nhà
- `houseData` (Object): 
  - `name` (String): Tên nhà mới
  - `address` (String): Địa chỉ mới

**Returns:** Updated House object

**Example:**
```javascript
const updated = await updateHouse('60d5ec49c1234567890abcd', {
  name: 'Nhà Quê',
  address: 'Làng Trung Kính'
});
```

---

#### `deleteHouse(houseId)`
Xóa một nhà

**Parameters:**
- `houseId` (String): ID của nhà

**Returns:** Confirmation message

**Example:**
```javascript
await deleteHouse('60d5ec49c1234567890abcd');
```

---

#### `inviteUserToHouse(houseId, inviteData)`
Mời user vào nhà

**Parameters:**
- `houseId` (String): ID của nhà
- `inviteData` (Object):
  - `email` (String): Email của user cần mời
  - `role` (String): 'Owner' hoặc 'Member'

**Returns:** Confirmation message

**Example:**
```javascript
const result = await inviteUserToHouse('60d5ec49c1234567890abcd', {
  email: 'user@example.com',
  role: 'Member'
});
```

---

## Setup Axios Interceptor

Service tự động:
- Thêm Authorization header với JWT token
- Xử lý lỗi và logs

**Token** được lấy từ `localStorage.getItem('token')`

---

## Error Handling

Tất cả các hàm throw error khi:
- Network error
- Invalid token
- Server error

**Usage:**
```javascript
try {
  const houses = await getAllHouses();
} catch (error) {
  console.error('Error:', error.message);
}
```

---

## Usage Example

```javascript
import { 
  getAllHouses, 
  createHouse, 
  inviteUserToHouse 
} from '../services/houseService';

function MyComponent() {
  const [houses, setHouses] = useState([]);

  useEffect(() => {
    async function loadHouses() {
      try {
        const data = await getAllHouses();
        setHouses(data);
      } catch (err) {
        console.error(err);
      }
    }
    loadHouses();
  }, []);

  const handleCreateHouse = async () => {
    const newHouse = await createHouse({
      name: 'Nhà Mới',
      address: 'Địa chỉ'
    });
    setHouses([...houses, newHouse]);
  };

  return (
    // JSX
  );
}
```
