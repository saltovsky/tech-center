import { useCallback, useEffect, useMemo, useState } from "react";
import api, { errorMessage } from "../api/client";
import { Alert } from "../components/Alert";
import { Loading } from "../components/Loading";
import type { DirectoryItem, Employee, StatusItem } from "../types";
import { AppLink } from "../router";

type Section = "organizations" | "employees" | "device-types" | "conditions" | "statuses";
type Item = DirectoryItem | Employee | StatusItem;

const sections: Record<Section, { title: string; endpoint: string; singular: string }> = {
  organizations: { title: "Организации", endpoint: "/organizations", singular: "организацию" },
  employees: { title: "Сотрудники", endpoint: "/employees", singular: "сотрудника" },
  "device-types": { title: "Виды техники", endpoint: "/device-types", singular: "вид техники" },
  conditions: { title: "Состояния техники", endpoint: "/conditions", singular: "состояние" },
  statuses: { title: "Статусы документов", endpoint: "/document-statuses", singular: "статус" },
};

function isEmployee(item: Item): item is Employee {
  return "full_name" in item;
}

function isStatus(item: Item): item is StatusItem {
  return "is_closed" in item;
}

export function DirectoryPage({ section = "organizations" }: { section?: Section }) {
  const current = sections[section] ?? sections.organizations;
  const [items, setItems] = useState<Item[]>([]);
  const [organizations, setOrganizations] = useState<DirectoryItem[]>([]);
  const [name, setName] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const [isClosed, setIsClosed] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const requests: Promise<unknown>[] = [
        api.get<Item[]>(current.endpoint).then(({ data }) => setItems(data)),
      ];
      if (section === "employees") {
        requests.push(
          api.get<DirectoryItem[]>("/organizations").then(({ data }) => setOrganizations(data)),
        );
      }
      await Promise.all(requests);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [current.endpoint, section]);

  useEffect(() => {
    setEditingId(null);
    setName("");
    setOrganizationId("");
    setIsClosed(false);
    void load();
  }, [load]);

  const selectedOrganization = useMemo(
    () => organizations.find((item) => item.id === organizationId),
    [organizations, organizationId],
  );

  const startEdit = (item: Item) => {
    setEditingId(item.id);
    setName(isEmployee(item) ? item.full_name : item.name);
    setOrganizationId(isEmployee(item) ? item.organization_id : "");
    setIsClosed(isStatus(item) ? item.is_closed : false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setOrganizationId("");
    setIsClosed(false);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    if (!name.trim()) {
      setError("Заполните наименование");
      return;
    }
    if (section === "employees" && !organizationId) {
      setError("Выберите организацию");
      return;
    }
    const payload =
      section === "employees"
        ? { full_name: name.trim(), organization_id: organizationId }
        : section === "statuses"
          ? { name: name.trim(), is_closed: isClosed }
          : { name: name.trim() };
    setSaving(true);
    try {
      if (editingId) await api.put(`${current.endpoint}/${editingId}`, payload);
      else await api.post(current.endpoint, payload);
      setSuccess(editingId ? "Изменения сохранены" : "Запись создана");
      resetForm();
      await load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item: Item) => {
    const label = isEmployee(item) ? item.full_name : item.name;
    if (!window.confirm(`Удалить «${label}»? Это действие нельзя отменить.`)) return;
    setError(null);
    try {
      await api.delete(`${current.endpoint}/${item.id}`);
      setSuccess("Запись удалена");
      await load();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <div>
          <span className="page-kicker">Reference data / directory control</span>
          <h1 className="h3 mt-2 mb-2">{current.title}</h1>
          <p className="text-body-secondary mb-0">Управление справочными данными</p>
        </div>
      </div>
      <nav className="nav nav-pills flex-nowrap overflow-x-auto gap-1 mb-4" aria-label="Справочники">
        {(Object.keys(sections) as Section[]).map((key) => (
          <AppLink
            key={key}
            to={`/directories/${key}`}
            className={(isActive) => `nav-link text-nowrap ${isActive ? "active" : ""}`}
          >
            {sections[key].title}
          </AppLink>
        ))}
      </nav>
      <Alert message={error} onClose={() => setError(null)} />
      <Alert message={success} variant="success" onClose={() => setSuccess(null)} />
      <div className="row g-4">
        <div className="col-12 col-xl-4">
          <section className="card shadow-sm">
            <div className="card-header bg-body fw-semibold">
              {editingId ? "Редактирование" : `Добавить ${current.singular}`}
            </div>
            <div className="card-body">
              <form onSubmit={(event) => void submit(event)}>
                <div className="mb-3">
                  <label className="form-label" htmlFor="directoryName">
                    {section === "employees" ? "ФИО" : "Наименование"}
                  </label>
                  <input
                    id="directoryName"
                    className="form-control"
                    value={name}
                    maxLength={255}
                    onChange={(event) => setName(event.target.value)}
                    required
                  />
                </div>
                {section === "employees" && (
                  <div className="mb-3">
                    <label className="form-label" htmlFor="organization">Организация</label>
                    <select
                      id="organization"
                      className="form-select"
                      value={organizationId}
                      onChange={(event) => setOrganizationId(event.target.value)}
                      required
                    >
                      <option value="">Выберите организацию</option>
                      {organizations.map((organization) => (
                        <option key={organization.id} value={organization.id}>{organization.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                {section === "statuses" && (
                  <div className="form-check mb-3">
                    <input
                      id="isClosed"
                      type="checkbox"
                      className="form-check-input"
                      checked={isClosed}
                      onChange={(event) => setIsClosed(event.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="isClosed">Закрывающий статус</label>
                  </div>
                )}
                <div className="d-flex gap-2">
                  <button className="btn btn-primary" disabled={saving}>
                    {saving && <span className="spinner-border spinner-border-sm me-2" />}
                    {editingId ? "Сохранить" : "Добавить"}
                  </button>
                  {editingId && (
                    <button type="button" className="btn btn-outline-secondary" onClick={resetForm}>
                      Отмена
                    </button>
                  )}
                </div>
              </form>
            </div>
          </section>
        </div>
        <div className="col-12 col-xl-8">
          <section className="card shadow-sm">
            <div className="card-header bg-body d-flex justify-content-between align-items-center">
              <span className="fw-semibold">Записи</span>
              <span className="badge text-bg-secondary">{items.length}</span>
            </div>
            {loading ? <Loading /> : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead>
                    <tr>
                      <th>{section === "employees" ? "ФИО" : "Наименование"}</th>
                      {section === "employees" && <th>Организация</th>}
                      {section === "statuses" && <th>Тип</th>}
                      <th className="text-end">Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 ? (
                      <tr><td colSpan={3} className="text-center text-body-secondary py-5">Записей пока нет</td></tr>
                    ) : items.map((item) => (
                      <tr key={item.id}>
                        <td className="fw-medium">{isEmployee(item) ? item.full_name : item.name}</td>
                        {section === "employees" && <td>{isEmployee(item) ? item.organization.name : selectedOrganization?.name}</td>}
                        {section === "statuses" && (
                          <td>{isStatus(item) && item.is_closed ? <span className="badge text-bg-secondary">Закрывающий</span> : <span className="badge text-bg-success">Активный</span>}</td>
                        )}
                        <td className="text-end text-nowrap">
                          <button className="btn btn-sm btn-outline-primary me-2" onClick={() => startEdit(item)} aria-label="Редактировать">
                            <i className="bi bi-pencil" />
                          </button>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => void remove(item)} aria-label="Удалить">
                            <i className="bi bi-trash" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
