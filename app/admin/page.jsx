'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Container,
  Table,
  Button,
  Modal,
  Form,
  Spinner,
  Alert,
  Badge,
  Row,
  Col,
  Accordion,
} from 'react-bootstrap';

const emptyForm = {
  id: null,

  // core
  title: '',
  status: 'Active',
  price: 0,
  beds: 0,
  baths: 0,

  // map coords (advanced override)
  latitude: '',
  longitude: '',

  // address
  address1: '',
  city: '',
  state: '',
  zip: '',
  neighborhood: '',

  // details
  description: '',
  property_type: '',
  sqft: '',
  lot_sqft: '',
  year_built: '',
  zillow_url: '',
  sold_at: '',

  // images
  photo_keys: [], // what we SAVE to DB
  photo_urls: [], // optional, display URLs from server (signed/public)
};

function isValidHttpUrlMaybeEmpty(value) {
  const v = String(value || '').trim();
  if (!v) return true;
  try {
    const u = new URL(v);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

function buildPreviewAddress({ address1, city, state, zip }) {
  return [address1, city, state, zip]
    .map((s) => String(s || '').trim())
    .filter(Boolean)
    .join(', ');
}

function moveItem(arr, fromIdx, toIdx) {
  const a = [...arr];
  const item = a[fromIdx];
  a.splice(fromIdx, 1);
  a.splice(toIdx, 0, item);
  return a;
}

function isHttpUrl(s) {
  const v = String(s || '').trim();
  return v.startsWith('http://') || v.startsWith('https://');
}

function toPublicUrlFromKey(key) {
  const base = (process.env.NEXT_PUBLIC_S3_PUBLIC_BASE_URL || '').replace(/\/+$/, '');
  const k = String(key || '').replace(/^\/+/, '');
  if (!base || !k) return '';
  return `${base}/${k}`;
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function isBlobUrl(s) {
  return String(s || '').startsWith('blob:');
}

export default function AdminPage() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const isEditing = useMemo(() => Boolean(form?.id), [form]);
  const showSoldDate = useMemo(() => form.status === 'Sold', [form.status]);

  // UI list of photos with local previews, drag reorder, uploading overlay.
  // Each item: { id, key, src, uploading, error }
  const [photosUI, setPhotosUI] = useState([]);

  // Drag reorder refs
  const dragFromIdxRef = useRef(null);

  async function refresh() {
    try {
      setLoading(true);
      setErr('');
      const res = await fetch('/api/admin/listings', { cache: 'no-store' });
      if (!res.ok) {
        const t = await res.text().catch(() => '');
        setErr(t || 'Unauthorized or failed to load.');
        setListings([]);
        return;
      }
      const data = await res.json();
      setListings(Array.isArray(data?.listings) ? data.listings : []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  // Keep form.photo_keys and form.photo_urls aligned to photosUI ordering
  function syncFormPhotosFromUI(nextUI) {
    const keys = nextUI.map((p) => (p.key ? String(p.key).trim() : '')).filter(Boolean);
    const urls = nextUI.map((p) => (isHttpUrl(p.src) ? p.src : ''));

    setForm((f) => ({
      ...f,
      photo_keys: keys,
      photo_urls: urls,
    }));
  }

  function revokeAllBlobUrls(list) {
    for (const p of list || []) {
      if (p?.src && isBlobUrl(p.src)) {
        try {
          URL.revokeObjectURL(p.src);
        } catch {}
      }
    }
  }

  const openNew = () => {
    setFormError('');
    setUploadError('');
    setForm(emptyForm);

    // Clear UI photos
    revokeAllBlobUrls(photosUI);
    setPhotosUI([]);

    setShow(true);
  };

  const openEdit = (l) => {
    setFormError('');
    setUploadError('');

    // clear old blob previews before swapping to new listing
    revokeAllBlobUrls(photosUI);

    const photoKeysRaw = Array.isArray(l?.photo_keys)
      ? l.photo_keys
      : Array.isArray(l?.photos)
        ? l.photos
        : [];

    const photoUrlsRaw = Array.isArray(l?.photos) ? l.photos : [];

    const keys = photoKeysRaw.map((x) => String(x || '').trim()).filter(Boolean);
    const urls = photoUrlsRaw.map((x) => String(x || '').trim()).filter(Boolean);

    // Build UI items
    const ui = keys.map((k, i) => {
      const maybeUrl = urls[i];
      const src =
        (isHttpUrl(maybeUrl) ? maybeUrl : '') ||
        (isHttpUrl(k) ? k : '') ||
        toPublicUrlFromKey(k) ||
        '/images/placeholder.png';

      return { id: makeId(), key: k, src, uploading: false, error: '' };
    });

    setPhotosUI(ui);

    setForm({
      ...emptyForm,
      id: l.id,
      title: l.title || '',
      status: l.status || 'Active',
      price: Number(l.price || 0),
      beds: Number(l.beds || 0),
      baths: Number(l.baths || 0),

      latitude: l.latitude ?? '',
      longitude: l.longitude ?? '',

      address1: l.address1 ?? '',
      city: l.city ?? '',
      state: l.state ?? '',
      zip: l.zip ?? '',
      neighborhood: l.neighborhood ?? '',

      description: l.description ?? '',
      property_type: l.property_type ?? '',
      sqft: l.sqft ?? '',
      lot_sqft: l.lot_sqft ?? '',
      year_built: l.year_built ?? '',
      zillow_url: l.zillow_url ?? '',
      sold_at: l.sold_at ? String(l.sold_at).slice(0, 10) : '',

      photo_keys: keys,
      photo_urls: urls,
    });

    setShow(true);
  };

  const close = () => {
    if (saving || uploading) return;

    revokeAllBlobUrls(photosUI);

    setShow(false);
  };

  const validate = () => {
    const title = String(form.title || '').trim();
    if (!title) return 'Title is required.';

    const price = Number(form.price);
    const beds = Number(form.beds);
    const baths = Number(form.baths);
    if (!Number.isFinite(price)) return 'Price must be a number.';
    if (!Number.isFinite(beds) || !Number.isFinite(baths)) return 'Beds and Baths must be numbers.';

    const latStr = String(form.latitude ?? '').trim();
    const lngStr = String(form.longitude ?? '').trim();
    const hasCoords = Boolean(latStr && lngStr);

    if ((latStr && !lngStr) || (!latStr && lngStr)) {
      return 'Please provide both Latitude and Longitude together.';
    }
    if (hasCoords) {
      const lat = Number(latStr);
      const lng = Number(lngStr);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return 'Latitude/Longitude must be valid numbers.';
    }

    const address1 = String(form.address1 || '').trim();
    const city = String(form.city || '').trim();
    const state = String(form.state || '').trim();
    const hasAddress = Boolean(address1 && city && state);

    if (!hasAddress && !hasCoords) {
      return 'Enter Address (street, city, state) so we can auto-generate map pins, or enter latitude and longitude manually.';
    }

    if (!isValidHttpUrlMaybeEmpty(form.zillow_url)) {
      return 'Zillow URL must be a valid http(s) link.';
    }

    if (showSoldDate && form.sold_at) {
      const d = new Date(form.sold_at);
      if (Number.isNaN(d.getTime())) return 'Sold date is invalid.';
    }

    return '';
  };

  async function uploadOneFile(file) {
    // 1) Get presigned URL
    const presignRes = await fetch('/api/admin/uploads/s3', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type,
        size: file.size,
      }),
    });

    if (!presignRes.ok) {
      const t = await presignRes.text().catch(() => '');
      throw new Error(t || 'Failed to prepare upload.');
    }

    const { uploadUrl, publicUrl, key } = await presignRes.json();

    if (!uploadUrl || !key) {
      throw new Error('Upload init response missing uploadUrl/key.');
    }

    // 2) PUT directly to S3
    const putRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    });

    if (!putRes.ok) {
      const t = await putRes.text().catch(() => '');
      throw new Error(t || `Upload failed for ${file.name}`);
    }

    return { key, publicUrl: publicUrl || '' };
  }

  async function uploadFilesToS3(files) {
    setUploadError('');
    if (!files?.length) return;

    setUploading(true);

    // Add local previews immediately
    const batch = files.map((file) => {
      const id = makeId();
      const blob = URL.createObjectURL(file);
      return { id, file, blob };
    });

    setPhotosUI((prev) => [
      ...prev,
      ...batch.map((b) => ({
        id: b.id,
        key: '',
        src: b.blob, // show instantly
        uploading: true,
        error: '',
      })),
    ]);

    try {
      for (const b of batch) {
        try {
          const { key, publicUrl } = await uploadOneFile(b.file);

          // Keep showing the local blob preview for instant UX,
          // we only need the key to save, server can provide signed URLs later.
          setPhotosUI((prev) => {
            const next = prev.map((p) =>
              p.id === b.id ? { ...p, key, uploading: false, error: '' } : p
            );
            syncFormPhotosFromUI(next);
            return next;
          });

          // If you want, you could swap to publicUrl when available.
          // Most buckets are private, so leaving blob is usually better until Save/refresh.
          // If you do want that behavior, uncomment:
          // if (isHttpUrl(publicUrl)) {
          //   setPhotosUI((prev) => {
          //     const next = prev.map((p) =>
          //       p.id === b.id ? { ...p, src: publicUrl } : p
          //     );
          //     syncFormPhotosFromUI(next);
          //     return next;
          //   });
          // }
        } catch (e) {
          setPhotosUI((prev) => {
            const next = prev.map((p) =>
              p.id === b.id ? { ...p, uploading: false, error: String(e?.message || 'Upload failed') } : p
            );
            syncFormPhotosFromUI(next);
            return next;
          });
        }
      }
    } finally {
      setUploading(false);
    }
  }

  const removePhotoAt = (idx) => {
    setPhotosUI((prev) => {
      const row = prev[idx];
      if (row?.src && isBlobUrl(row.src)) {
        try {
          URL.revokeObjectURL(row.src);
        } catch {}
      }
      const next = prev.filter((_, i) => i !== idx);
      syncFormPhotosFromUI(next);
      return next;
    });
  };

  const onDragStart = (idx) => {
    dragFromIdxRef.current = idx;
  };

  const onDragOver = (e) => {
    e.preventDefault();
  };

  const onDrop = (toIdx) => {
    const fromIdx = dragFromIdxRef.current;
    dragFromIdxRef.current = null;

    if (fromIdx === null || fromIdx === undefined) return;
    if (fromIdx === toIdx) return;

    setPhotosUI((prev) => {
      if (toIdx < 0 || toIdx >= prev.length) return prev;
      const next = moveItem(prev, fromIdx, toIdx);
      syncFormPhotosFromUI(next);
      return next;
    });
  };

  const onSave = async () => {
    setFormError('');
    const v = validate();
    if (v) {
      setFormError(v);
      return;
    }

    setSaving(true);
    try {
      const latStr = String(form.latitude ?? '').trim();
      const lngStr = String(form.longitude ?? '').trim();
      const hasCoords = Boolean(latStr && lngStr);

      const payload = {
        title: String(form.title || '').trim(),
        status: form.status,
        price: Number(form.price || 0),
        beds: Number(form.beds || 0),
        baths: Number(form.baths || 0),

        address1: String(form.address1 || '').trim() || null,
        city: String(form.city || '').trim() || null,
        state: String(form.state || '').trim() || null,
        zip: String(form.zip || '').trim() || null,
        neighborhood: String(form.neighborhood || '').trim() || null,

        description: String(form.description || '').trim() || null,
        property_type: String(form.property_type || '').trim() || null,

        sqft: String(form.sqft).trim() === '' ? null : Number(form.sqft),
        lot_sqft: String(form.lot_sqft).trim() === '' ? null : Number(form.lot_sqft),
        year_built: String(form.year_built).trim() === '' ? null : Number(form.year_built),

        zillow_url: String(form.zillow_url || '').trim() || null,
        sold_at: showSoldDate ? (form.sold_at ? form.sold_at : null) : null,

        // KEYS only
        photos: Array.isArray(form.photo_keys) ? form.photo_keys : [],
      };

      if (hasCoords) {
        payload.latitude = Number(latStr);
        payload.longitude = Number(lngStr);
      }

      const url = isEditing ? `/api/admin/listings/${form.id}` : '/api/admin/listings';
      const method = isEditing ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const t = await res.text().catch(() => '');
        setFormError(t || 'Failed to save listing.');
        return;
      }

      // After save, refresh so server returns signed/display URLs,
      // then UI thumbnails will use real remote URLs on next openEdit.
      setShow(false);
      await refresh();
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id) => {
    const ok = confirm('Delete this listing? This cannot be undone.');
    if (!ok) return;

    const res = await fetch(`/api/admin/listings/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const t = await res.text().catch(() => '');
      alert(t || 'Failed to delete listing.');
      return;
    }
    await refresh();
  };

  const addressPreview = useMemo(
    () => buildPreviewAddress(form),
    [form.address1, form.city, form.state, form.zip]
  );

  return (
    <main className="admin-shell">
      <Container className="py-4">
        <div className="admin-header">
          <div>
            <h1 className="admin-title">Admin Dashboard</h1>
            <p className="admin-subtitle">Add, edit, and remove listings. This page is allowlisted for admins only.</p>
          </div>

          <div className="admin-actions">
            <Button as={Link} href="/listings" variant="outline-light" className="rounded-pill">
              View site
            </Button>
            <Button variant="warning" className="rounded-pill" onClick={openNew}>
              Add new listing
            </Button>
          </div>
        </div>

        {err ? <Alert variant="danger" className="mt-3">{err}</Alert> : null}

        <div className="admin-card mt-3">
          {loading ? (
            <div className="py-5 text-center">
              <Spinner animation="border" role="status" />
            </div>
          ) : (
            <Table responsive hover className="admin-table mb-0">
              <thead>
                <tr>
                  <th style={{ width: 90 }}>ID</th>
                  <th>Title</th>
                  <th style={{ width: 140 }}>Status</th>
                  <th style={{ width: 170 }}>Price</th>
                  <th style={{ width: 120 }}>Beds</th>
                  <th style={{ width: 120 }}>Baths</th>
                  <th style={{ width: 220 }} className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {listings.map((l) => (
                  <tr key={l.id}>
                    <td className="text-muted">{l.id}</td>
                    <td className="fw-semibold">{l.title}</td>
                    <td>
                      <Badge bg={l.status === 'Sold' ? 'dark' : 'warning'} text={l.status === 'Sold' ? 'light' : 'dark'}>
                        {l.status}
                      </Badge>
                    </td>
                    <td>${Number(l.price || 0).toLocaleString()}</td>
                    <td>{l.beds}</td>
                    <td>{l.baths}</td>
                    <td className="text-end">
                      <Button variant="outline-light" size="sm" className="rounded-pill me-2" onClick={() => openEdit(l)}>
                        Edit
                      </Button>
                      <Button variant="outline-danger" size="sm" className="rounded-pill" onClick={() => onDelete(l.id)}>
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}

                {listings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center text-muted py-4">No listings found.</td>
                  </tr>
                ) : null}
              </tbody>
            </Table>
          )}
        </div>
      </Container>

      <Modal show={show} onHide={close} centered size="lg" contentClassName="admin-modal">
        <Modal.Header closeButton closeVariant="white">
          <Modal.Title>{isEditing ? 'Edit listing' : 'Add new listing'}</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {formError ? <Alert variant="danger" className="mb-3">{formError}</Alert> : null}
          {uploadError ? <Alert variant="danger" className="mb-3">{uploadError}</Alert> : null}

          <Form>
            <Accordion defaultActiveKey="property" alwaysOpen>
              {/* PROPERTY */}
              <Accordion.Item eventKey="property">
                <Accordion.Header>Property</Accordion.Header>
                <Accordion.Body>
                  <Form.Group className="mb-3">
                    <Form.Label>Title</Form.Label>
                    <Form.Control
                      value={form.title}
                      onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                      placeholder="e.g., Bernal Heights View Home"
                    />
                  </Form.Group>

                  <Row className="g-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Status</Form.Label>
                        <Form.Select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
                          <option value="Active">Active</option>
                          <option value="Sold">Sold</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Price</Form.Label>
                        <Form.Control
                          type="number"
                          value={form.price}
                          onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                          min="0"
                        />
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Beds</Form.Label>
                        <Form.Control
                          type="number"
                          value={form.beds}
                          onChange={(e) => setForm((f) => ({ ...f, beds: e.target.value }))}
                          min="0"
                        />
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Baths</Form.Label>
                        <Form.Control
                          type="number"
                          value={form.baths}
                          onChange={(e) => setForm((f) => ({ ...f, baths: e.target.value }))}
                          min="0"
                        />
                      </Form.Group>
                    </Col>

                    {showSoldDate ? (
                      <Col md={12}>
                        <Form.Group>
                          <Form.Label>Sold date</Form.Label>
                          <Form.Control
                            type="date"
                            value={form.sold_at}
                            onChange={(e) => setForm((f) => ({ ...f, sold_at: e.target.value }))}
                          />
                        </Form.Group>
                      </Col>
                    ) : null}

                    <Col md={12}>
                      <Form.Group>
                        <Form.Label>Zillow link</Form.Label>
                        <Form.Control
                          value={form.zillow_url}
                          onChange={(e) => setForm((f) => ({ ...f, zillow_url: e.target.value }))}
                          placeholder="https://www.zillow.com/homedetails/..."
                        />
                        <div className="form-text text-light opacity-75">
                          Optional, recommended so users can jump to Zillow quickly.
                        </div>
                      </Form.Group>
                    </Col>
                  </Row>
                </Accordion.Body>
              </Accordion.Item>

              {/* ADDRESS */}
              <Accordion.Item eventKey="address">
                <Accordion.Header>Address</Accordion.Header>
                <Accordion.Body>
                  <Row className="g-3">
                    <Col md={12}>
                      <Form.Group>
                        <Form.Label>Street address <span className="text-warning">*</span></Form.Label>
                        <Form.Control
                          value={form.address1}
                          onChange={(e) => setForm((f) => ({ ...f, address1: e.target.value }))}
                          placeholder="123 Main St"
                        />
                        <div className="form-text text-light opacity-75">
                          We auto-generate map coordinates from the address when you save (free). Advanced override is in Info.
                        </div>
                      </Form.Group>
                    </Col>

                    <Col md={5}>
                      <Form.Group>
                        <Form.Label>City <span className="text-warning">*</span></Form.Label>
                        <Form.Control
                          value={form.city}
                          onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                          placeholder="San Francisco"
                        />
                      </Form.Group>
                    </Col>

                    <Col md={3}>
                      <Form.Group>
                        <Form.Label>State <span className="text-warning">*</span></Form.Label>
                        <Form.Control
                          value={form.state}
                          onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                          placeholder="CA"
                        />
                      </Form.Group>
                    </Col>

                    <Col md={4}>
                      <Form.Group>
                        <Form.Label>ZIP</Form.Label>
                        <Form.Control
                          value={form.zip}
                          onChange={(e) => setForm((f) => ({ ...f, zip: e.target.value }))}
                          placeholder="00000"
                        />
                      </Form.Group>
                    </Col>

                    <Col md={12}>
                      <Form.Group>
                        <Form.Label>Neighborhood</Form.Label>
                        <Form.Control
                          value={form.neighborhood}
                          onChange={(e) => setForm((f) => ({ ...f, neighborhood: e.target.value }))}
                          placeholder="Bernal Heights"
                        />
                      </Form.Group>
                    </Col>

                    {addressPreview ? (
                      <Col md={12}>
                        <div className="form-text text-light opacity-75">Address preview:</div>
                        <div className="text-light fw-semibold">{addressPreview}</div>
                      </Col>
                    ) : null}
                  </Row>
                </Accordion.Body>
              </Accordion.Item>

              {/* INFO */}
              <Accordion.Item eventKey="info">
                <Accordion.Header>Info</Accordion.Header>
                <Accordion.Body>
                  <Row className="g-3">
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label>Property type</Form.Label>
                        <Form.Control
                          value={form.property_type}
                          onChange={(e) => setForm((f) => ({ ...f, property_type: e.target.value }))}
                          placeholder="Single Family, Condo, Townhome..."
                        />
                      </Form.Group>
                    </Col>

                    <Col md={4}>
                      <Form.Group>
                        <Form.Label>Sqft</Form.Label>
                        <Form.Control
                          type="number"
                          value={form.sqft}
                          onChange={(e) => setForm((f) => ({ ...f, sqft: e.target.value }))}
                          placeholder="0"
                          min="0"
                        />
                      </Form.Group>
                    </Col>

                    <Col md={4}>
                      <Form.Group>
                        <Form.Label>Lot sqft</Form.Label>
                        <Form.Control
                          type="number"
                          value={form.lot_sqft}
                          onChange={(e) => setForm((f) => ({ ...f, lot_sqft: e.target.value }))}
                          placeholder="0"
                          min="0"
                        />
                      </Form.Group>
                    </Col>

                    <Col md={4}>
                      <Form.Group>
                        <Form.Label>Year built</Form.Label>
                        <Form.Control
                          type="number"
                          value={form.year_built}
                          onChange={(e) => setForm((f) => ({ ...f, year_built: e.target.value }))}
                          placeholder="0000"
                          min="0"
                        />
                      </Form.Group>
                    </Col>

                    <Col md={8}>
                      <Form.Group>
                        <Form.Label>Description</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={3}
                          value={form.description}
                          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                          placeholder="Write a short description buyers will see across the site..."
                        />
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Latitude (advanced override)</Form.Label>
                        <Form.Control
                          type="number"
                          value={form.latitude}
                          onChange={(e) => setForm((f) => ({ ...f, latitude: e.target.value }))}
                          placeholder="0"
                          step="any"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Longitude (advanced override)</Form.Label>
                        <Form.Control
                          type="number"
                          value={form.longitude}
                          onChange={(e) => setForm((f) => ({ ...f, longitude: e.target.value }))}
                          placeholder="0"
                          step="any"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </Accordion.Body>
              </Accordion.Item>

              {/* IMAGES */}
              <Accordion.Item eventKey="images">
                <Accordion.Header>Images</Accordion.Header>
                <Accordion.Body>
                  <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
                    <div className="text-light opacity-75">
                      Upload images to S3. Drag to reorder.
                    </div>

                    <div className="d-flex align-items-center gap-2">
                      <Form.Label className="mb-0">
                        <Form.Control
                          type="file"
                          accept="image/*"
                          multiple
                          disabled={uploading}
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            e.target.value = '';
                            uploadFilesToS3(files);
                          }}
                        />
                      </Form.Label>

                      {uploading ? (
                        <div className="d-flex align-items-center gap-2 text-light">
                          <Spinner animation="border" size="sm" />
                          <span>Uploading…</span>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {photosUI.length ? (
                    <>
                      <div className="text-light opacity-75 mb-2" style={{ fontSize: 13 }}>
                        Tip: drag a card to change ordering.
                      </div>

                      <div
                        className="d-grid gap-2"
                        style={{
                          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                        }}
                      >
                        {photosUI.map((p, idx) => (
                          <div
                            key={p.id}
                            draggable
                            onDragStart={() => onDragStart(idx)}
                            onDragOver={onDragOver}
                            onDrop={() => onDrop(idx)}
                            className="rounded"
                            style={{
                              background: 'rgba(255,255,255,0.06)',
                              border: '1px solid rgba(255,255,255,0.08)',
                              overflow: 'hidden',
                              cursor: 'grab',
                              position: 'relative',
                            }}
                            title="Drag to reorder"
                          >
                            <div style={{ position: 'relative' }}>
                              <img
                                src={p.src || '/images/placeholder.png'}
                                alt={`photo-${idx}`}
                                style={{
                                  width: '100%',
                                  height: 140,
                                  objectFit: 'cover',
                                  display: 'block',
                                }}
                                onError={(e) => {
                                  e.currentTarget.src = '/images/placeholder.png';
                                }}
                              />

                              {p.uploading ? (
                                <div
                                  style={{
                                    position: 'absolute',
                                    inset: 0,
                                    background: 'rgba(0,0,0,0.45)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 10,
                                  }}
                                >
                                  <Spinner animation="border" size="sm" />
                                  <span className="text-light" style={{ fontSize: 13 }}>Uploading…</span>
                                </div>
                              ) : null}
                            </div>

                            <div className="p-2">
                              <div className="d-flex align-items-start justify-content-between gap-2">
                                <div className="text-light" style={{ fontSize: 12, wordBreak: 'break-all' }}>
                                  {p.key ? p.key : 'Preparing upload...'}
                                </div>

                                <Button
                                  size="sm"
                                  variant="outline-danger"
                                  className="rounded-pill"
                                  onClick={() => removePhotoAt(idx)}
                                  disabled={p.uploading}
                                  style={{ flexShrink: 0 }}
                                >
                                  Remove
                                </Button>
                              </div>

                              {p.error ? (
                                <div className="text-danger mt-2" style={{ fontSize: 12 }}>
                                  {p.error}
                                </div>
                              ) : null}

                              <div className="text-light opacity-50 mt-2" style={{ fontSize: 12 }}>
                                Order: {idx + 1}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="text-light opacity-75 mb-3">
                      No images yet. Upload some.
                    </div>
                  )}

                  {!process.env.NEXT_PUBLIC_S3_PUBLIC_BASE_URL ? (
                    <div className="form-text text-light opacity-75 mt-3">
                      Tip: If your API is saving keys (like <code>public/listings/...</code>), set{' '}
                      <code>NEXT_PUBLIC_S3_PUBLIC_BASE_URL</code> so the admin UI can build preview links when it has no signed URL.
                      Example: <code>https://realestatepro-images-prod.s3.us-east-1.amazonaws.com</code>
                    </div>
                  ) : null}
                </Accordion.Body>
              </Accordion.Item>
            </Accordion>
          </Form>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="outline-light" className="rounded-pill" onClick={close} disabled={saving || uploading}>
            Cancel
          </Button>
          <Button variant="warning" className="rounded-pill" onClick={onSave} disabled={saving || uploading}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </Modal.Footer>
      </Modal>
    </main>
  );
}