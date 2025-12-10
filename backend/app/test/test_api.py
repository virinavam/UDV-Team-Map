import uuid

import requests

BASE_URL = "http://localhost:8000"


# ===================== AUTH ENDPOINTS =====================


def test_register_new_user():
    """Проверяем регистрацию нового пользователя"""
    user_email = f"testuser_{uuid.uuid4().hex[:8]}@example.com"
    register_data = {"email": user_email, "password": "SecurePassword123", "first_name": "Test", "last_name": "User"}

    r = requests.post(f"{BASE_URL}/api/auth/register", json=register_data)
    assert r.status_code == 200
    data = r.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert "user_id" in data
    assert "role" in data


def test_login_user(auth_tokens):
    """Проверяем вход пользователя в систему"""
    # auth_tokens создается в conftest из админ данных
    assert "access_token" in auth_tokens
    assert "refresh_token" in auth_tokens
    assert "user_id" in auth_tokens
    assert auth_tokens["role"] in ["SYSTEM_ADMIN", "HR_ADMIN", "EMPLOYEE"]


def test_refresh_token(auth_tokens):
    """Проверяем обновление токена"""
    refresh_token = auth_tokens["refresh_token"]
    r = requests.post(f"{BASE_URL}/api/auth/refresh", json={"refresh_token": refresh_token})
    assert r.status_code == 200
    data = r.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert "user_id" in data
    assert "role" in data


# ===================== EMPLOYEES ENDPOINTS =====================


def test_get_employees(auth_header):
    """Проверяем получение списка всех сотрудников"""
    r = requests.get(f"{BASE_URL}/api/employees/", headers=auth_header)
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    # Проверяем структуру первого сотрудника если список не пуст
    if data:
        employee = data[0]
        assert "id" in employee
        assert "email" in employee
        assert "first_name" in employee
        assert "last_name" in employee
        assert "is_active" in employee


def test_get_employee_by_id(auth_header, auth_tokens):
    """Проверяем получение сотрудника по ID"""
    user_id = auth_tokens["user_id"]
    r = requests.get(f"{BASE_URL}/api/employees/{user_id}", headers=auth_header)
    assert r.status_code == 200
    data = r.json()
    assert data["id"] == str(user_id)
    assert "email" in data
    assert "first_name" in data
    assert "last_name" in data
    assert data["is_active"] is True


def test_update_employee(auth_header, auth_tokens):
    """Проверяем обновление данных сотрудника"""
    user_id = auth_tokens["user_id"]
    update_data = {
        "first_name": "UpdatedName",
        "position": "Senior Developer",
        "city": "Moscow",
        "phone": "+79991234567",
    }

    r = requests.put(f"{BASE_URL}/api/employees/{user_id}", headers=auth_header, json=update_data)
    assert r.status_code == 200
    data = r.json()
    assert data["first_name"] == "UpdatedName"
    assert data["position"] == "Senior Developer"
    assert data["city"] == "Moscow"
    assert data["phone"] == "+79991234567"


def test_deactivate_employee(auth_header, auth_tokens):
    """Проверяем деактивацию сотрудника"""
    # Сначала создаем нового сотрудника для деактивации
    user_email = f"deactivate_test_{uuid.uuid4().hex[:8]}@example.com"
    register_data = {"email": user_email, "password": "Password123", "first_name": "ToDeactivate", "last_name": "User"}

    register_resp = requests.post(f"{BASE_URL}/api/auth/register", json=register_data)
    assert register_resp.status_code == 200
    new_user_id = register_resp.json()["user_id"]

    # Теперь деактивируем его
    r = requests.delete(f"{BASE_URL}/api/employees/{new_user_id}", headers=auth_header)
    assert r.status_code == 200
    data = r.json()
    assert data["is_active"] is False


# ===================== LEGAL ENTITIES ENDPOINTS =====================


def test_create_legal_entity(auth_header):
    """Проверяем создание юридического лица"""
    le_name = f"ООО TestCompany_{uuid.uuid4().hex[:6]}"
    create_data = {"name": le_name}

    r = requests.post(f"{BASE_URL}/api/legal-entities/", headers=auth_header, json=create_data)
    assert r.status_code == 200
    data = r.json()
    assert "id" in data
    assert data["name"] == le_name
    assert "departments" in data
    assert isinstance(data["departments"], list)
    return data["id"]


def test_get_legal_entities(auth_header):
    """Проверяем получение списка всех юридических лиц"""
    r = requests.get(f"{BASE_URL}/api/legal-entities/", headers=auth_header)
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    # Проверяем структуру первого юридического лица если список не пуст
    if data:
        le = data[0]
        assert "id" in le
        assert "name" in le
        assert "departments" in le


def test_get_legal_entity_by_id(auth_header):
    """Проверяем получение юридического лица по ID"""
    # Сначала создаем юридическое лицо
    le_name = f"ООО GetTest_{uuid.uuid4().hex[:6]}"
    create_data = {"name": le_name}
    create_resp = requests.post(f"{BASE_URL}/api/legal-entities/", headers=auth_header, json=create_data)
    assert create_resp.status_code == 200
    le_id = create_resp.json()["id"]

    # Теперь получаем его по ID
    r = requests.get(f"{BASE_URL}/api/legal-entities/{le_id}", headers=auth_header)
    assert r.status_code == 200
    data = r.json()
    assert data["id"] == le_id
    assert data["name"] == le_name


def test_update_legal_entity(auth_header):
    """Проверяем обновление юридического лица"""
    # Сначала создаем юридическое лицо
    le_name = f"ООО UpdateTest_{uuid.uuid4().hex[:6]}"
    create_data = {"name": le_name}
    create_resp = requests.post(f"{BASE_URL}/api/legal-entities/", headers=auth_header, json=create_data)
    assert create_resp.status_code == 200
    le_id = create_resp.json()["id"]

    # Обновляем его
    new_name = f"ООО UpdatedName_{uuid.uuid4().hex[:6]}"
    update_data = {"name": new_name}
    r = requests.patch(f"{BASE_URL}/api/legal-entities/{le_id}", headers=auth_header, json=update_data)
    assert r.status_code == 200
    data = r.json()
    assert data["name"] == new_name


def test_delete_legal_entity(auth_header):
    """Проверяем удаление юридического лица"""
    # Сначала создаем юридическое лицо
    le_name = f"ООО DeleteTest_{uuid.uuid4().hex[:6]}"
    create_data = {"name": le_name}
    create_resp = requests.post(f"{BASE_URL}/api/legal-entities/", headers=auth_header, json=create_data)
    assert create_resp.status_code == 200
    le_id = create_resp.json()["id"]

    # Удаляем его
    r = requests.delete(f"{BASE_URL}/api/legal-entities/{le_id}", headers=auth_header)
    assert r.status_code == 204


# ===================== DEPARTMENTS ENDPOINTS =====================


def test_create_department(auth_header):
    """Проверяем создание отдела"""
    # Сначала создаем юридическое лицо
    le_name = f"ООО DeptTest_{uuid.uuid4().hex[:6]}"
    le_create_data = {"name": le_name}
    le_resp = requests.post(f"{BASE_URL}/api/legal-entities/", headers=auth_header, json=le_create_data)
    assert le_resp.status_code == 200
    le_id = le_resp.json()["id"]

    # Теперь создаем отдел
    dept_name = f"Department_{uuid.uuid4().hex[:6]}"
    dept_data = {"name": dept_name, "legal_entity_id": le_id}

    r = requests.post(f"{BASE_URL}/api/departments/", headers=auth_header, json=dept_data)
    assert r.status_code == 200
    data = r.json()
    assert "id" in data
    assert data["name"] == dept_name
    assert data["legal_entity_id"] == le_id
    assert "employees" in data
    return data["id"], le_id


def test_get_departments(auth_header):
    """Проверяем получение списка всех отделов"""
    r = requests.get(f"{BASE_URL}/api/departments/", headers=auth_header)
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    # Проверяем структуру первого отдела если список не пуст
    if data:
        dept = data[0]
        assert "id" in dept
        assert "name" in dept
        assert "legal_entity_id" in dept
        assert "employees" in dept


def test_get_department_by_id(auth_header):
    """Проверяем получение отдела по ID"""
    # Сначала создаем отдел
    le_name = f"ООО GetDeptTest_{uuid.uuid4().hex[:6]}"
    le_create_data = {"name": le_name}
    le_resp = requests.post(f"{BASE_URL}/api/legal-entities/", headers=auth_header, json=le_create_data)
    assert le_resp.status_code == 200
    le_id = le_resp.json()["id"]

    dept_name = f"GetDept_{uuid.uuid4().hex[:6]}"
    dept_data = {"name": dept_name, "legal_entity_id": le_id}
    create_resp = requests.post(f"{BASE_URL}/api/departments/", headers=auth_header, json=dept_data)
    assert create_resp.status_code == 200
    dept_id = create_resp.json()["id"]

    # Теперь получаем его по ID
    r = requests.get(f"{BASE_URL}/api/departments/{dept_id}", headers=auth_header)
    assert r.status_code == 200
    data = r.json()
    assert data["id"] == dept_id
    assert data["name"] == dept_name


def test_update_department(auth_header):
    """Проверяем обновление отдела"""
    # Сначала создаем отдел
    le_name = f"ООО UpdateDeptTest_{uuid.uuid4().hex[:6]}"
    le_create_data = {"name": le_name}
    le_resp = requests.post(f"{BASE_URL}/api/legal-entities/", headers=auth_header, json=le_create_data)
    assert le_resp.status_code == 200
    le_id = le_resp.json()["id"]

    dept_name = f"UpdateDept_{uuid.uuid4().hex[:6]}"
    dept_data = {"name": dept_name, "legal_entity_id": le_id}
    create_resp = requests.post(f"{BASE_URL}/api/departments/", headers=auth_header, json=dept_data)
    assert create_resp.status_code == 200
    dept_id = create_resp.json()["id"]

    # Обновляем его
    new_name = f"UpdatedDept_{uuid.uuid4().hex[:6]}"
    update_data = {"name": new_name}
    r = requests.patch(f"{BASE_URL}/api/departments/{dept_id}", headers=auth_header, json=update_data)
    assert r.status_code == 200
    data = r.json()
    assert data["name"] == new_name


def test_delete_department(auth_header):
    """Проверяем удаление отдела"""
    # Сначала создаем отдел
    le_name = f"ООО DeleteDeptTest_{uuid.uuid4().hex[:6]}"
    le_create_data = {"name": le_name}
    le_resp = requests.post(f"{BASE_URL}/api/legal-entities/", headers=auth_header, json=le_create_data)
    assert le_resp.status_code == 200
    le_id = le_resp.json()["id"]

    dept_name = f"DeleteDept_{uuid.uuid4().hex[:6]}"
    dept_data = {"name": dept_name, "legal_entity_id": le_id}
    create_resp = requests.post(f"{BASE_URL}/api/departments/", headers=auth_header, json=dept_data)
    assert create_resp.status_code == 200
    dept_id = create_resp.json()["id"]

    # Удаляем его
    r = requests.delete(f"{BASE_URL}/api/departments/{dept_id}", headers=auth_header)
    assert r.status_code == 204
