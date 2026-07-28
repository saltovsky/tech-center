import { useCallback, useEffect, useMemo, useState } from "react";
import api, { errorMessage } from "../api/client";
import { Alert } from "../components/Alert";
import { Loading } from "../components/Loading";
import type {
  DirectoryItem,
  DocumentPage,
  DocumentRecord,
  Employee,
  StatusItem,
} from "../types";

interface FormState {
  date: string;
  organization_id: string;
  employee_id: string;
  device_type_id: string;
  model: string;
  serial_number: string;
  condition_id: string;
  status_id: string;
}

const emptyForm = (): FormState => ({
  date: new Date().toISOString().slice(0, 10),
  organization_id: "",
  employee_id: "",
  device_type_id: "",
  model: "",
  serial_number: "",
  condition_id: "",
  status_id: "",
});

const columns = [
  ["date", "Дата"],
  ["organization", "Организация"],
  ["employee", "Сотрудник"],
  ["device_type", "Техника"],
  ["model", "Модель"],
  ["serial_number", "Серийный №"],
  ["condition", "Состояние"],
  ["status", "Статус"],
] as const;

export function DocumentsPage() {
  const [data, setData] = useState<DocumentPage | null>(null);
  const [organizations, setOrganizations] = useState<DirectoryItem[]>([]);
  const [deviceTypes, setDeviceTypes] = useState<DirectoryItem[]>([]);
  const [conditions, setConditions] = useState<DirectoryItem[]>([]);
  const [statuses, setStatuses] = useState<StatusItem[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(20);
  const [sortBy, setSortBy] = useState("date");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const { data: response } = await api.get<DocumentPage>("/documents", {
        params: {
          page,
          size,
          sort_by: sortBy,
          order,
          status: statusFilter || undefined,
          search: debouncedSearch || undefined,
        },
      });
      setData(response);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, order, page, size, sortBy, statusFilter]);

  useEffect(() => {
    void Promise.all([
      api.get<DirectoryItem[]>("/organizations").then(({ data: value }) => setOrganizations(value)),
      api.get<DirectoryItem[]>("/device-types").then(({ data: value }) => setDeviceTypes(value)),
      api.get<DirectoryItem[]>("/conditions").then(({ data: value }) => setConditions(value)),
      api.get<StatusItem[]>("/document-statuses").then(({ data: value }) => setStatuses(value)),
    ]).catch((err) => setError(errorMessage(err)));
  }, []);

  useEffect(() => {
    void loadDocuments();
  }, [loadDocuments]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 350);
    return () => window.clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    if (!form.organization_id) {
      setEmployees([]);
      return;
    }
    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      api
        .get<Employee[]>("/employees", {
          params: { organization_id: form.organization_id, search: employeeSearch || undefined },
          signal: controller.signal,
        })
        .then(({ data: value }) => setEmployees(value))
        .catch((err) => {
          if (!controller.signal.aborted) setError(errorMessage(err));
        });
    }, 300);
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [employeeSearch, form.organization_id]);

  const updateField = (field: keyof FormState, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: value,
      ...(field === "organization_id" ? { employee_id: "" } : {}),
    }));
    if (field === "serial_number" || field === "status_id") setDuplicateWarning(null);
  };

  const startCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setEmployeeSearch("");
    setDuplicateWarning(null);
    setShowForm(true);
  };

  const startEdit = (item: DocumentRecord) => {
    setEditingId(item.id);
    setForm({
      date: item.date,
      organization_id: item.organization_id,
      employee_id: item.employee_id,
      device_type_id: item.device_type_id,
      model: item.model,
      serial_number: item.serial_number,
      condition_id: item.condition_id,
      status_id: item.status_id,
    });
    setEmployees([item.employee]);
    setEmployeeSearch(item.employee.full_name);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const checkDuplicate = async () => {
    if (!form.serial_number.trim() || !form.status_id) return;
    try {
      const { data: result } = await api.get<{ duplicate: boolean }>("/documents/check-serial", {
        params: {
          serial_number: form.serial_number.trim(),
          status_id: form.status_id,
          exclude_id: editingId || undefined,
        },
      });
      setDuplicateWarning(
        result.duplicate
          ? "Внимание: документ с таким серийным номером и статусом уже существует."
          : null,
      );
    } catch {
      setDuplicateWarning(null);
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    if (Object.values(form).some((value) => !value.trim())) {
      setError("Заполните все поля документа");
      return;
    }
    setSaving(true);
    try {
      if (editingId) await api.put(`/documents/${editingId}`, form);
      else await api.post("/documents", form);
      setSuccess(editingId ? "Документ обновлён" : "Документ создан");
      setShowForm(false);
      setForm(emptyForm());
      await loadDocuments();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item: DocumentRecord) => {
    if (!window.confirm(`Удалить документ на ${item.device_type.name} ${item.model}?`)) return;
    try {
      await api.delete(`/documents/${item.id}`);
      setSuccess("Документ удалён");
      if (data?.items.length === 1 && page > 1) setPage((value) => value - 1);
      else await loadDocuments();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const sort = (field: string) => {
    if (sortBy === field) setOrder((value) => (value === "asc" ? "desc" : "asc"));
    else {
      setSortBy(field);
      setOrder("asc");
    }
    setPage(1);
  };

  const exportExcel = async () => {
    try {
      const response = await api.get<Blob>("/documents/export.xlsx", {
        params: {
          status_id: statusFilter || undefined,
          search: debouncedSearch || undefined,
        },
        responseType: "blob",
      });
      const url = URL.createObjectURL(response.data);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "journal.xlsx";
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const options = useMemo(
    () => ({
      organization_id: organizations,
      device_type_id: deviceTypes,
      condition_id: conditions,
      status_id: statuses,
    }),
    [conditions, deviceTypes, organizations, statuses],
  );

  return (
    <>
      <div className="page-heading d-flex flex-wrap justify-content-between align-items-end gap-3 mb-4">
        <div>
          <span className="page-kicker">Asset operations / document flow</span>
          <h1 className="h3 mt-2 mb-2">Журнал выдачи техники</h1>
          <p className="text-body-secondary mb-0">
            {data ? `Всего документов: ${data.total}` : "Загрузка документов"}
          </p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-success" onClick={() => void exportExcel()}>
            <i className="bi bi-file-earmark-excel me-1" /> Экспорт
          </button>
          <button className="btn btn-primary" onClick={startCreate}>
            <i className="bi bi-plus-lg me-1" /> Новый документ
          </button>
        </div>
      </div>
      <Alert message={error} onClose={() => setError(null)} />
      <Alert message={success} variant="success" onClose={() => setSuccess(null)} />
      <section className="operation-strip mb-4" aria-label="Сводка журнала">
        <div className="operation-metric">
          <small>Total records</small>
          <strong>{data?.total ?? "—"}</strong>
          <span>Документов в выборке</span>
        </div>
        <div className="operation-metric">
          <small>Current page</small>
          <strong>{data ? `${data.page}/${data.pages}` : "—"}</strong>
          <span>Серверная пагинация</span>
        </div>
        <div className="operation-metric">
          <small>Status scope</small>
          <strong className="metric-text">
            {statuses.find((item) => item.id === statusFilter)?.name ?? "Все"}
          </strong>
          <span>{debouncedSearch ? `Поиск: ${debouncedSearch}` : "Без поискового ограничения"}</span>
        </div>
        <div className="operation-metric live">
          <small>System state</small>
          <strong><span className="status-dot" /> Live</strong>
          <span>Данные синхронизированы</span>
        </div>
      </section>
      {showForm && (
        <section className="card shadow-sm mb-4" aria-labelledby="document-form-title">
          <div className="card-header bg-body d-flex justify-content-between align-items-center">
            <h2 id="document-form-title" className="h5 mb-0">
              {editingId ? "Редактирование документа" : "Новый документ"}
            </h2>
            <button className="btn-close" aria-label="Закрыть" onClick={() => setShowForm(false)} />
          </div>
          <div className="card-body">
            <form onSubmit={(event) => void submit(event)}>
              <div className="row g-3">
                <div className="col-12 col-md-4 col-xl-3">
                  <label htmlFor="docDate" className="form-label">Дата</label>
                  <input id="docDate" type="date" className="form-control" value={form.date} onChange={(event) => updateField("date", event.target.value)} required />
                </div>
                {(Object.keys(options) as Array<keyof typeof options>).map((field) => (
                  <div className="col-12 col-md-4 col-xl-3" key={field}>
                    <label className="form-label" htmlFor={field}>
                      {field === "organization_id" ? "Организация" : field === "device_type_id" ? "Вид техники" : field === "condition_id" ? "Состояние" : "Статус"}
                    </label>
                    <select id={field} className="form-select" value={form[field]} onChange={(event) => updateField(field, event.target.value)} required>
                      <option value="">Выберите</option>
                      {options[field].map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                    </select>
                  </div>
                ))}
                <div className="col-12 col-md-8 col-xl-6">
                  <label htmlFor="employeeSearch" className="form-label">Поиск сотрудника</label>
                  <input
                    id="employeeSearch"
                    className="form-control mb-2"
                    placeholder={form.organization_id ? "Начните вводить ФИО" : "Сначала выберите организацию"}
                    value={employeeSearch}
                    disabled={!form.organization_id}
                    onChange={(event) => setEmployeeSearch(event.target.value)}
                  />
                  <select
                    className="form-select"
                    aria-label="Сотрудник"
                    value={form.employee_id}
                    disabled={!form.organization_id}
                    onChange={(event) => updateField("employee_id", event.target.value)}
                    required
                  >
                    <option value="">Выберите сотрудника</option>
                    {employees.map((item) => <option key={item.id} value={item.id}>{item.full_name}</option>)}
                  </select>
                </div>
                <div className="col-12 col-md-6 col-xl-3">
                  <label htmlFor="model" className="form-label">Модель</label>
                  <input id="model" className="form-control" maxLength={255} value={form.model} onChange={(event) => updateField("model", event.target.value)} required />
                </div>
                <div className="col-12 col-md-6 col-xl-3">
                  <label htmlFor="serial" className="form-label">Серийный номер</label>
                  <input id="serial" className="form-control" maxLength={255} value={form.serial_number} onBlur={() => void checkDuplicate()} onChange={(event) => updateField("serial_number", event.target.value)} required />
                </div>
              </div>
              {duplicateWarning && <div className="alert alert-warning mt-3 mb-0">{duplicateWarning}</div>}
              <div className="d-flex gap-2 mt-4">
                <button className="btn btn-primary" disabled={saving}>
                  {saving && <span className="spinner-border spinner-border-sm me-2" />}
                  {editingId ? "Сохранить" : "Создать"}
                </button>
                <button type="button" className="btn btn-outline-secondary" onClick={() => setShowForm(false)}>Отмена</button>
              </div>
            </form>
          </div>
        </section>
      )}
      <section className="card shadow-sm">
        <div className="card-header bg-body d-flex flex-wrap justify-content-between align-items-center gap-3">
          <span className="fw-semibold">Документы</span>
          <div className="d-flex flex-wrap align-items-center gap-2">
            <div className="input-group input-group-sm journal-search">
              <span className="input-group-text" aria-hidden="true">
                <i className="bi bi-search" />
              </span>
              <input
                id="journalSearch"
                type="search"
                className="form-control"
                value={search}
                maxLength={255}
                placeholder="Организация, сотрудник, модель, серийный номер"
                aria-label="Поиск по журналу"
                onChange={(event) => setSearch(event.target.value)}
              />
              {search && (
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  aria-label="Очистить поиск"
                  onClick={() => setSearch("")}
                >
                  <i className="bi bi-x-lg" />
                </button>
              )}
            </div>
            <div className="d-flex align-items-center gap-2">
              <label htmlFor="statusFilter" className="small text-body-secondary">Статус</label>
              <select id="statusFilter" className="form-select form-select-sm filter-select" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }}>
                <option value="">Все</option>
                {statuses.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </div>
          </div>
        </div>
        {loading ? <Loading /> : (
          <>
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    {columns.map(([field, label]) => (
                      <th key={field}>
                        <button className="btn btn-link text-body fw-semibold text-decoration-none p-0 text-nowrap" onClick={() => sort(field)}>
                          {label} {sortBy === field && <i className={`bi ${order === "asc" ? "bi-sort-up" : "bi-sort-down"}`} />}
                        </button>
                      </th>
                    ))}
                    <th className="text-end">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {!data?.items.length ? (
                    <tr>
                      <td colSpan={9} className="text-center text-body-secondary py-5">
                        {debouncedSearch ? "По вашему запросу ничего не найдено" : "Документы не найдены"}
                      </td>
                    </tr>
                  ) : data.items.map((item) => (
                    <tr key={item.id}>
                      <td className="text-nowrap">{new Date(`${item.date}T00:00:00`).toLocaleDateString("ru-RU")}</td>
                      <td>{item.organization.name}</td>
                      <td>{item.employee.full_name}</td>
                      <td>{item.device_type.name}</td>
                      <td>{item.model}</td>
                      <td><code>{item.serial_number}</code></td>
                      <td>{item.condition.name}</td>
                      <td><span className={`badge ${item.status.is_closed ? "text-bg-secondary" : "text-bg-success"}`}>{item.status.name}</span></td>
                      <td className="text-end text-nowrap">
                        <button className="btn btn-sm btn-outline-primary me-2" onClick={() => startEdit(item)} aria-label="Редактировать"><i className="bi bi-pencil" /></button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => void remove(item)} aria-label="Удалить"><i className="bi bi-trash" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="card-footer bg-body d-flex flex-wrap justify-content-between align-items-center gap-2">
              <div className="d-flex align-items-center gap-2">
                <span className="small text-body-secondary">На странице</span>
                <select className="form-select form-select-sm page-size" value={size} onChange={(event) => { setSize(Number(event.target.value)); setPage(1); }}>
                  {[10, 20, 50, 100].map((value) => <option key={value}>{value}</option>)}
                </select>
              </div>
              <div className="d-flex align-items-center gap-2">
                <button className="btn btn-sm btn-outline-secondary" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}><i className="bi bi-chevron-left" /> Назад</button>
                <span className="small">Страница {data?.page ?? 1} из {data?.pages ?? 1}</span>
                <button className="btn btn-sm btn-outline-secondary" disabled={!data || page >= data.pages} onClick={() => setPage((value) => value + 1)}>Вперёд <i className="bi bi-chevron-right" /></button>
              </div>
            </div>
          </>
        )}
      </section>
    </>
  );
}
