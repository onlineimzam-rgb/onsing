import { neon } from '@neondatabase/serverless'
import { unstable_noStore as noStore } from 'next/cache'

const connectionString = process.env.POSTGRES_URL

type SqlClient = (query: string | TemplateStringsArray, params?: any[]) => Promise<any[]>

function createMockSql(): SqlClient {
  return (() => Promise.resolve([] as any[])) as unknown as SqlClient
}

// Wrap sql çağrılarını noStore() ile sar — Next.js 14 bazı GET route handler'larını
// `dynamic = 'force-dynamic'` olsa bile statik prerender etmeye çalışıyor. noStore()
// her DB sorgusunda route'u zorla dynamic yapar (build cache'i bypass).
function wrapWithNoStore(client: SqlClient): SqlClient {
  return ((query: any, params?: any[]) => {
    try {
      noStore()
    } catch {
      // build/script ortamında çağrılırsa sessizce yoksay
    }
    return client(query, params)
  }) as SqlClient
}

export const sql: SqlClient = connectionString
  ? wrapWithNoStore(neon(connectionString) as unknown as SqlClient)
  : createMockSql()

// ===========================
// Types
// ===========================

export interface Property {
  id: number
  reference_no: string
  slug: string
  type: 'satilik' | 'kiralik' | 'gunluk-kiralik'
  category: string
  status: 'aktif' | 'satildi' | 'kiralandi' | 'rezerve' | 'pasif'
  title_tr: string
  title_en: string
  description_tr: string | null
  description_en: string | null
  price: number
  currency: 'TRY' | 'EUR'
  price_per_m2: number | null
  city: string | null
  district: string | null
  neighborhood: string | null
  address: string | null
  lat: number | null
  lng: number | null
  bedrooms: number | null
  bathrooms: number | null
  area_m2: number | null
  lot_m2: number | null
  building_age: number | null
  floor: number | null
  total_floors: number | null
  heating_type: string | null
  is_detached: boolean | null
  in_site: boolean | null
  land_status: string | null
  owner_name: string | null
  owner_phone: string | null
  owner_email: string | null
  owner_notes: string | null
  features: string[] | null
  cover_image: string | null
  // Tapu / kadastro bilgileri (özellikle arsa & tarla için)
  ada_no: string | null
  parsel_no: string | null
  pafta_no: string | null
  // Harici kaynak referansı (sahibinden vb.)
  external_url: string | null
  is_featured: boolean
  display_order: number
  views: number
  created_at: Date
  updated_at: Date
  sold_at: Date | null
}

export interface PropertyImage {
  id: number
  property_id: number
  url: string
  alt_text: string | null
  display_order: number
}

export interface Lead {
  id: number
  intent: 'alici' | 'satici' | 'kiraci' | 'kiralik-veren'
  name: string
  phone: string
  email: string | null
  property_type: string | null
  category: string | null
  district: string | null
  budget_min: number | null
  budget_max: number | null
  currency: 'TRY' | 'EUR'
  rooms: string | null
  area_min: number | null
  lot_min: number | null
  total_floors: number | null
  is_detached: boolean | null
  in_site: boolean | null
  land_status: string | null
  location_note: string | null
  message: string | null
  crm_notes: string | null
  crm_activity_summary: string | null
  status: 'yeni' | 'iletisimde' | 'eslestirildi' | 'kapatildi'
  created_at: Date
}

export interface ValuationRequest {
  id: number
  name: string
  phone: string
  email: string | null
  address: string
  city: string | null
  district: string | null
  neighborhood: string | null
  property_type: string | null
  area_m2: number | null
  lot_m2: number | null
  year_built: number | null
  rooms: string | null
  ada_no: string | null
  parsel_no: string | null
  pafta_no: string | null
  parcel_query_url: string | null
  manual_property_info: string | null
  property_photos: string[] | null
  notes: string | null
  documents: string[] | null
  status: 'yeni' | 'incelemede' | 'tamamlandi'
  estimated_value: number | null
  estimated_currency: 'TRY' | 'EUR' | null
  response_notes: string | null
  value_min: number | null
  value_max: number | null
  unit_price_min: number | null
  unit_price_max: number | null
  marketing_time: string | null
  market_position: string | null
  methodology: string | null
  expert_opinion: string | null
  comparables: Array<Record<string, unknown>> | null
  ai_draft: Record<string, unknown> | null
  report_status: string | null
  crm_notes: string | null
  created_at: Date
}

/** Kapalı işlem / satış kaydı (admin İşler modülü) */
export interface SalesTransaction {
  id: number
  property_id: number | null
  contract_id: number | null
  buyer_name: string | null
  seller_name: string | null
  sale_price: number | null
  currency: string
  commission_amount: number | null
  commission_currency: string
  invoice_issued: boolean
  invoice_no: string | null
  contract_signed_at: Date | null
  sale_completed_at: Date | null
  notes: string | null
  stage: string
  created_at: Date
  updated_at: Date
}

export interface BlogPost {
  id: number
  slug: string
  title_tr: string
  title_en: string | null
  excerpt_tr: string | null
  excerpt_en: string | null
  content_tr: string
  content_en: string | null
  cover_image: string | null
  tags: string[] | null
  author: string
  is_published: boolean
  published_at: Date | null
  views: number
  created_at: Date
  updated_at: Date
}

export interface GalleryImage {
  id: number
  url: string
  category: string | null
  title: string | null
  alt_text: string | null
  display_order: number
  created_at: Date
}

export interface SiteSetting {
  key: string
  value: string | null
  updated_at: Date
}

export interface Inquiry {
  id: number
  name: string
  phone: string | null
  email: string | null
  subject: string | null
  message: string
  property_id: number | null
  status: 'yeni' | 'okundu' | 'yanitlandi'
  created_at: Date
}

/** Sözleşme (master) — bir başlık altında birden fazla imza oturumu (taraf) tutar */
export interface Contract {
  id: number
  contract_type: string
  form_snapshot: Record<string, unknown>
  rendered_text: string
  title: string | null
  status: 'taslak' | 'aktif' | 'tamamlandi' | 'iptal'
  created_at: Date
  updated_at: Date
}

/** Uzaktan / çevrim içi imza oturumu (elektronik imza ≠ güvenli e-imza bilgilendirmesi için şablonda uyarı vardır) */
export interface ContractSignSession {
  id: number
  contract_id: number | null
  role: string | null
  token: string
  contract_type: string
  form_snapshot: Record<string, unknown>
  rendered_text: string
  status: 'bekliyor' | 'imzalandi' | 'iptal'
  signer_name: string | null
  signer_tc: string | null
  signer_email: string | null
  signer_phone: string | null
  signature_png: string | null
  signer_accepted_terms: boolean | null
  signer_ip: string | null
  signer_user_agent: string | null
  signed_at: Date | null
  created_at: Date
}

// ===========================
// Schema SQL
// ===========================

export const createPropertiesSQL = `
CREATE TABLE IF NOT EXISTS properties (
  id SERIAL PRIMARY KEY,
  reference_no VARCHAR(20) UNIQUE NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  type VARCHAR(30) NOT NULL,
  category VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'aktif',
  title_tr VARCHAR(300) NOT NULL,
  title_en VARCHAR(300) NOT NULL,
  description_tr TEXT,
  description_en TEXT,
  price NUMERIC(14,2) NOT NULL DEFAULT 0,
  currency VARCHAR(5) DEFAULT 'TRY',
  price_per_m2 NUMERIC(12,2),
  city VARCHAR(100),
  district VARCHAR(100),
  neighborhood VARCHAR(150),
  address TEXT,
  lat NUMERIC(10,7),
  lng NUMERIC(10,7),
  bedrooms INTEGER,
  bathrooms INTEGER,
  area_m2 INTEGER,
  lot_m2 INTEGER,
  building_age INTEGER,
  floor INTEGER,
  total_floors INTEGER,
  heating_type VARCHAR(50),
  is_detached BOOLEAN,
  in_site BOOLEAN,
  land_status VARCHAR(100),
  owner_name VARCHAR(200),
  owner_phone VARCHAR(50),
  owner_email VARCHAR(200),
  owner_notes TEXT,
  features TEXT[],
  cover_image TEXT,
  ada_no VARCHAR(30),
  parsel_no VARCHAR(30),
  pafta_no VARCHAR(30),
  external_url TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sold_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(type);
CREATE INDEX IF NOT EXISTS idx_properties_category ON properties(category);
CREATE INDEX IF NOT EXISTS idx_properties_district ON properties(district);
CREATE INDEX IF NOT EXISTS idx_properties_featured ON properties(is_featured);
CREATE INDEX IF NOT EXISTS idx_properties_slug ON properties(slug);
`

export const createPropertyImagesSQL = `
CREATE TABLE IF NOT EXISTS property_images (
  id SERIAL PRIMARY KEY,
  property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt_text VARCHAR(255),
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_property_images_pid ON property_images(property_id);
CREATE INDEX IF NOT EXISTS idx_property_images_order ON property_images(display_order);
`

export const createLeadsSQL = `
CREATE TABLE IF NOT EXISTS leads (
  id SERIAL PRIMARY KEY,
  intent VARCHAR(30) NOT NULL,
  name VARCHAR(200) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  email VARCHAR(200),
  property_type VARCHAR(30),
  category VARCHAR(50),
  district VARCHAR(100),
  budget_min NUMERIC(14,2),
  budget_max NUMERIC(14,2),
  currency VARCHAR(5) DEFAULT 'TRY',
  rooms VARCHAR(20),
  area_min INTEGER,
  lot_min INTEGER,
  total_floors INTEGER,
  is_detached BOOLEAN,
  in_site BOOLEAN,
  land_status VARCHAR(100),
  location_note TEXT,
  message TEXT,
  status VARCHAR(30) DEFAULT 'yeni',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_leads_intent ON leads(intent);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
`

export const createValuationsSQL = `
CREATE TABLE IF NOT EXISTS valuation_requests (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  email VARCHAR(200),
  address TEXT NOT NULL,
  city VARCHAR(100),
  district VARCHAR(100),
  neighborhood VARCHAR(150),
  property_type VARCHAR(50),
  area_m2 INTEGER,
  lot_m2 INTEGER,
  year_built INTEGER,
  rooms VARCHAR(20),
  ada_no VARCHAR(30),
  parsel_no VARCHAR(30),
  pafta_no VARCHAR(30),
  parcel_query_url TEXT,
  manual_property_info TEXT,
  property_photos TEXT[],
  notes TEXT,
  documents TEXT[],
  status VARCHAR(30) DEFAULT 'yeni',
  estimated_value NUMERIC(14,2),
  estimated_currency VARCHAR(5),
  response_notes TEXT,
  value_min NUMERIC(14,2),
  value_max NUMERIC(14,2),
  unit_price_min NUMERIC(14,2),
  unit_price_max NUMERIC(14,2),
  marketing_time VARCHAR(120),
  market_position VARCHAR(120),
  methodology TEXT,
  expert_opinion TEXT,
  comparables JSONB DEFAULT '[]',
  ai_draft JSONB DEFAULT '{}',
  report_status VARCHAR(30) DEFAULT 'taslak',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_valuations_status ON valuation_requests(status);
`

export const createBlogPostsSQL = `
CREATE TABLE IF NOT EXISTS blog_posts (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(255) UNIQUE NOT NULL,
  title_tr VARCHAR(300) NOT NULL,
  title_en VARCHAR(300),
  excerpt_tr TEXT,
  excerpt_en TEXT,
  content_tr TEXT NOT NULL,
  content_en TEXT,
  cover_image TEXT,
  tags TEXT[],
  author VARCHAR(150) DEFAULT 'Çandarlı Uzman',
  is_published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMP,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_blog_published ON blog_posts(is_published);
CREATE INDEX IF NOT EXISTS idx_blog_slug ON blog_posts(slug);
`

export const createGallerySQL = `
CREATE TABLE IF NOT EXISTS gallery_images (
  id SERIAL PRIMARY KEY,
  url TEXT NOT NULL,
  category VARCHAR(50),
  title VARCHAR(255),
  alt_text VARCHAR(255),
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_gallery_category ON gallery_images(category);
CREATE INDEX IF NOT EXISTS idx_gallery_order ON gallery_images(display_order);
`

export const createSiteSettingsSQL = `
CREATE TABLE IF NOT EXISTS site_settings (
  key VARCHAR(80) PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`

export const createInquiriesSQL = `
CREATE TABLE IF NOT EXISTS inquiries (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  phone VARCHAR(50),
  email VARCHAR(200),
  subject VARCHAR(255),
  message TEXT NOT NULL,
  property_id INTEGER REFERENCES properties(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'yeni',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_property ON inquiries(property_id);
`

export const createContractsSQL = `
CREATE TABLE IF NOT EXISTS contracts (
  id SERIAL PRIMARY KEY,
  contract_type VARCHAR(40) NOT NULL,
  title VARCHAR(255),
  form_snapshot JSONB NOT NULL DEFAULT '{}',
  rendered_text TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'aktif',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_contracts_type ON contracts(contract_type);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_created ON contracts(created_at DESC);
`

export const createContractSignSessionsSQL = `
CREATE TABLE IF NOT EXISTS contract_sign_sessions (
  id SERIAL PRIMARY KEY,
  contract_id INTEGER,
  role VARCHAR(40),
  token VARCHAR(64) UNIQUE NOT NULL,
  contract_type VARCHAR(40) NOT NULL,
  form_snapshot JSONB NOT NULL DEFAULT '{}',
  rendered_text TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'bekliyor',
  signer_name VARCHAR(200),
  signer_tc VARCHAR(20),
  signer_email VARCHAR(200),
  signer_phone VARCHAR(50),
  signature_png TEXT,
  signer_accepted_terms BOOLEAN DEFAULT FALSE,
  signer_ip VARCHAR(120),
  signer_user_agent TEXT,
  signed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_contract_sign_token ON contract_sign_sessions(token);
CREATE INDEX IF NOT EXISTS idx_contract_sign_status ON contract_sign_sessions(status);
`

// Eski deploy'lardan kalmış tablolarda eksik olabilecek yeni kolonları
// idempotent olarak ekler.
const migrationsSQL = `
ALTER TABLE properties ADD COLUMN IF NOT EXISTS ada_no VARCHAR(30);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS parsel_no VARCHAR(30);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS pafta_no VARCHAR(30);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS external_url TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS is_detached BOOLEAN;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS in_site BOOLEAN;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS land_status VARCHAR(100);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS owner_name VARCHAR(200);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS owner_phone VARCHAR(50);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS owner_email VARCHAR(200);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS owner_notes TEXT;

ALTER TABLE leads ADD COLUMN IF NOT EXISTS lot_min INTEGER;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS total_floors INTEGER;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS is_detached BOOLEAN;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS in_site BOOLEAN;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS land_status VARCHAR(100);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS location_note TEXT;

ALTER TABLE valuation_requests ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE valuation_requests ADD COLUMN IF NOT EXISTS district VARCHAR(100);
ALTER TABLE valuation_requests ADD COLUMN IF NOT EXISTS neighborhood VARCHAR(150);
ALTER TABLE valuation_requests ADD COLUMN IF NOT EXISTS ada_no VARCHAR(30);
ALTER TABLE valuation_requests ADD COLUMN IF NOT EXISTS parsel_no VARCHAR(30);
ALTER TABLE valuation_requests ADD COLUMN IF NOT EXISTS pafta_no VARCHAR(30);
ALTER TABLE valuation_requests ADD COLUMN IF NOT EXISTS parcel_query_url TEXT;
ALTER TABLE valuation_requests ADD COLUMN IF NOT EXISTS manual_property_info TEXT;
ALTER TABLE valuation_requests ADD COLUMN IF NOT EXISTS property_photos TEXT[];
ALTER TABLE valuation_requests ADD COLUMN IF NOT EXISTS documents TEXT[];
ALTER TABLE valuation_requests ADD COLUMN IF NOT EXISTS value_min NUMERIC(14,2);
ALTER TABLE valuation_requests ADD COLUMN IF NOT EXISTS value_max NUMERIC(14,2);
ALTER TABLE valuation_requests ADD COLUMN IF NOT EXISTS unit_price_min NUMERIC(14,2);
ALTER TABLE valuation_requests ADD COLUMN IF NOT EXISTS unit_price_max NUMERIC(14,2);
ALTER TABLE valuation_requests ADD COLUMN IF NOT EXISTS marketing_time VARCHAR(120);
ALTER TABLE valuation_requests ADD COLUMN IF NOT EXISTS market_position VARCHAR(120);
ALTER TABLE valuation_requests ADD COLUMN IF NOT EXISTS methodology TEXT;
ALTER TABLE valuation_requests ADD COLUMN IF NOT EXISTS expert_opinion TEXT;
ALTER TABLE valuation_requests ADD COLUMN IF NOT EXISTS comparables JSONB DEFAULT '[]';
ALTER TABLE valuation_requests ADD COLUMN IF NOT EXISTS ai_draft JSONB DEFAULT '{}';
ALTER TABLE valuation_requests ADD COLUMN IF NOT EXISTS report_status VARCHAR(30) DEFAULT 'taslak';

CREATE TABLE IF NOT EXISTS site_settings (
  key VARCHAR(80) PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sözleşme bundle ilişkisi için kolon migration (eski deploylar)
ALTER TABLE contract_sign_sessions ADD COLUMN IF NOT EXISTS contract_id INTEGER;
ALTER TABLE contract_sign_sessions ADD COLUMN IF NOT EXISTS role VARCHAR(40);
CREATE INDEX IF NOT EXISTS idx_contract_sign_contract ON contract_sign_sessions(contract_id);

-- Arsa/tarla/bağ-bahçe kategorilerinde m² yanlış alana yazıldıysa düzelt
UPDATE properties
   SET lot_m2 = area_m2, area_m2 = NULL
 WHERE category IN ('arsa', 'tarla', 'bag-bahce')
   AND lot_m2 IS NULL
   AND area_m2 IS NOT NULL;

ALTER TABLE leads ADD COLUMN IF NOT EXISTS crm_notes TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS crm_activity_summary TEXT;
ALTER TABLE valuation_requests ADD COLUMN IF NOT EXISTS crm_notes TEXT;

CREATE TABLE IF NOT EXISTS sales_transactions (
  id SERIAL PRIMARY KEY,
  property_id INTEGER REFERENCES properties(id) ON DELETE SET NULL,
  contract_id INTEGER REFERENCES contracts(id) ON DELETE SET NULL,
  buyer_name VARCHAR(200),
  seller_name VARCHAR(200),
  sale_price NUMERIC(14,2),
  currency VARCHAR(5) DEFAULT 'TRY',
  commission_amount NUMERIC(14,2),
  commission_currency VARCHAR(5) DEFAULT 'TRY',
  invoice_issued BOOLEAN DEFAULT FALSE,
  invoice_no VARCHAR(120),
  contract_signed_at DATE,
  sale_completed_at DATE,
  notes TEXT,
  stage VARCHAR(40) DEFAULT 'sozlesme',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE sales_transactions ADD COLUMN IF NOT EXISTS stage VARCHAR(40) DEFAULT 'sozlesme';

CREATE INDEX IF NOT EXISTS idx_sales_transactions_created ON sales_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_transactions_property ON sales_transactions(property_id);
CREATE INDEX IF NOT EXISTS idx_sales_transactions_contract ON sales_transactions(contract_id);
`

export async function setupDatabase() {
  if (!connectionString) throw new Error('POSTGRES_URL tanımlı değil')
  const client = neon(connectionString) as any
  const allSQL =
    createPropertiesSQL + '\n' +
    createPropertyImagesSQL + '\n' +
    createLeadsSQL + '\n' +
    createValuationsSQL + '\n' +
    createBlogPostsSQL + '\n' +
    createGallerySQL + '\n' +
    createInquiriesSQL + '\n' +
    createSiteSettingsSQL + '\n' +
    createContractsSQL + '\n' +
    createContractSignSessionsSQL + '\n' +
    migrationsSQL
  const statements = allSQL.split(';').filter((s) => s.trim())
  for (const statement of statements) {
    await client(statement)
  }

  // Eski imza oturumlarını yeni contracts bundle'larına bağla (idempotent)
  const orphan = (await client(
    `SELECT id, contract_type, form_snapshot, rendered_text, status, created_at, signer_name
       FROM contract_sign_sessions
      WHERE contract_id IS NULL
      ORDER BY created_at ASC`
  )) as Array<{
    id: number
    contract_type: string
    form_snapshot: Record<string, unknown>
    rendered_text: string
    status: string
    created_at: Date
    signer_name: string | null
  }>
  for (const s of orphan) {
    const inserted = (await client(
      `INSERT INTO contracts (contract_type, title, form_snapshot, rendered_text, status, created_at, updated_at)
       VALUES ($1, $2, $3::jsonb, $4, $5, $6, $6)
       RETURNING id`,
      [
        s.contract_type,
        s.signer_name ? `${s.signer_name}` : null,
        JSON.stringify(s.form_snapshot || {}),
        s.rendered_text || '',
        s.status === 'imzalandi' ? 'tamamlandi' : 'aktif',
        s.created_at,
      ]
    )) as Array<{ id: number }>
    const newId = inserted[0]?.id
    if (newId) {
      await client(
        `UPDATE contract_sign_sessions SET contract_id = $1 WHERE id = $2`,
        [newId, s.id]
      )
    }
  }
}

export async function ensureSiteSettingsSchema() {
  if (!connectionString) throw new Error('POSTGRES_URL tanımlı değil')
  const parts = createSiteSettingsSQL.split(';').filter((s) => s.trim())
  for (const statement of parts) {
    await sql(statement)
  }
}

export async function ensureValuationsSchema() {
  if (!connectionString) throw new Error('POSTGRES_URL tanımlı değil')
  const statements = [
    `ALTER TABLE valuation_requests ADD COLUMN IF NOT EXISTS value_min NUMERIC(14,2)`,
    `ALTER TABLE valuation_requests ADD COLUMN IF NOT EXISTS value_max NUMERIC(14,2)`,
    `ALTER TABLE valuation_requests ADD COLUMN IF NOT EXISTS unit_price_min NUMERIC(14,2)`,
    `ALTER TABLE valuation_requests ADD COLUMN IF NOT EXISTS unit_price_max NUMERIC(14,2)`,
    `ALTER TABLE valuation_requests ADD COLUMN IF NOT EXISTS marketing_time VARCHAR(120)`,
    `ALTER TABLE valuation_requests ADD COLUMN IF NOT EXISTS market_position VARCHAR(120)`,
    `ALTER TABLE valuation_requests ADD COLUMN IF NOT EXISTS methodology TEXT`,
    `ALTER TABLE valuation_requests ADD COLUMN IF NOT EXISTS expert_opinion TEXT`,
    `ALTER TABLE valuation_requests ADD COLUMN IF NOT EXISTS comparables JSONB DEFAULT '[]'`,
    `ALTER TABLE valuation_requests ADD COLUMN IF NOT EXISTS ai_draft JSONB DEFAULT '{}'`,
    `ALTER TABLE valuation_requests ADD COLUMN IF NOT EXISTS report_status VARCHAR(30) DEFAULT 'taslak'`,
    `ALTER TABLE valuation_requests ADD COLUMN IF NOT EXISTS crm_notes TEXT`,
  ]
  for (const statement of statements) {
    await sql(statement)
  }
}

export async function ensureContractsSchema() {
  if (!connectionString) throw new Error('POSTGRES_URL tanımlı değil')
  const statements = [
    createContractsSQL,
    createContractSignSessionsSQL,
    `ALTER TABLE contract_sign_sessions ADD COLUMN IF NOT EXISTS contract_id INTEGER`,
    `ALTER TABLE contract_sign_sessions ADD COLUMN IF NOT EXISTS role VARCHAR(40)`,
    `CREATE INDEX IF NOT EXISTS idx_contract_sign_contract ON contract_sign_sessions(contract_id)`,
  ]
  for (const block of statements) {
    const parts = block.split(';').filter((s) => s.trim())
    for (const statement of parts) {
      await sql(statement)
    }
  }
}

/**
 * CRM görev / hatırlatma kaydı (admin görev panosu).
 */
export interface CrmTask {
  id: number
  title: string
  description: string | null
  due_at: Date | null
  status: 'acik' | 'tamamlandi' | 'iptal'
  priority: 'dusuk' | 'normal' | 'yuksek'
  related_kind: 'lead' | 'valuation' | 'owner' | 'contract' | 'sale' | 'genel'
  related_id: number | null
  related_label: string | null
  assignee: string | null
  created_at: Date
  updated_at: Date
}

export async function ensureCrmAndSalesSchema() {
  if (!connectionString) throw new Error('POSTGRES_URL tanımlı değil')
  const alters = [
    `ALTER TABLE leads ADD COLUMN IF NOT EXISTS crm_notes TEXT`,
    `ALTER TABLE leads ADD COLUMN IF NOT EXISTS crm_activity_summary TEXT`,
    `ALTER TABLE valuation_requests ADD COLUMN IF NOT EXISTS crm_notes TEXT`,
  ]
  for (const s of alters) {
    await sql(s)
  }
  const tasksSql = `
CREATE TABLE IF NOT EXISTS crm_tasks (
  id SERIAL PRIMARY KEY,
  title VARCHAR(240) NOT NULL,
  description TEXT,
  due_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'acik',
  priority VARCHAR(20) DEFAULT 'normal',
  related_kind VARCHAR(30) DEFAULT 'genel',
  related_id INTEGER,
  related_label VARCHAR(240),
  assignee VARCHAR(120),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_crm_tasks_status ON crm_tasks(status);
CREATE INDEX IF NOT EXISTS idx_crm_tasks_due_at ON crm_tasks(due_at);
CREATE INDEX IF NOT EXISTS idx_crm_tasks_related ON crm_tasks(related_kind, related_id);
`
  for (const part of tasksSql.split(';').filter((s) => s.trim())) {
    await sql(part)
  }
  const salesSql = `
CREATE TABLE IF NOT EXISTS sales_transactions (
  id SERIAL PRIMARY KEY,
  property_id INTEGER REFERENCES properties(id) ON DELETE SET NULL,
  contract_id INTEGER REFERENCES contracts(id) ON DELETE SET NULL,
  buyer_name VARCHAR(200),
  seller_name VARCHAR(200),
  sale_price NUMERIC(14,2),
  currency VARCHAR(5) DEFAULT 'TRY',
  commission_amount NUMERIC(14,2),
  commission_currency VARCHAR(5) DEFAULT 'TRY',
  invoice_issued BOOLEAN DEFAULT FALSE,
  invoice_no VARCHAR(120),
  contract_signed_at DATE,
  sale_completed_at DATE,
  notes TEXT,
  stage VARCHAR(40) DEFAULT 'sozlesme',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE sales_transactions ADD COLUMN IF NOT EXISTS stage VARCHAR(40) DEFAULT 'sozlesme';
CREATE INDEX IF NOT EXISTS idx_sales_transactions_created ON sales_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_transactions_property ON sales_transactions(property_id);
CREATE INDEX IF NOT EXISTS idx_sales_transactions_contract ON sales_transactions(contract_id);
`
  for (const part of salesSql.split(';').filter((s) => s.trim())) {
    await sql(part)
  }
}
