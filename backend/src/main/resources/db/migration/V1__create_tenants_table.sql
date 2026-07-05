CREATE TABLE tenants (
    id UUID PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    email VARCHAR(150),
    phone VARCHAR(30),
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,

    CONSTRAINT uk_tenants_slug UNIQUE (slug)
);

CREATE INDEX idx_tenants_slug
    ON tenants(slug);

CREATE INDEX idx_tenants_status
    ON tenants(status);