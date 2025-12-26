export namespace main {
	
	export class AppConfig {
	    first_run: boolean;
	    // Go type: time
	    initialized_at: any;
	    storage_exists: boolean;
	    onboarding_shown: boolean;
	    // Go type: time
	    last_opened_at: any;
	    version: string;
	
	    static createFrom(source: any = {}) {
	        return new AppConfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.first_run = source["first_run"];
	        this.initialized_at = this.convertValues(source["initialized_at"], null);
	        this.storage_exists = source["storage_exists"];
	        this.onboarding_shown = source["onboarding_shown"];
	        this.last_opened_at = this.convertValues(source["last_opened_at"], null);
	        this.version = source["version"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ApplicationFeedback {
	    id: string;
	    type: string;
	    title: string;
	    content: string;
	    rating: number;
	    // Go type: time
	    timestamp: any;
	
	    static createFrom(source: any = {}) {
	        return new ApplicationFeedback(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.type = source["type"];
	        this.title = source["title"];
	        this.content = source["content"];
	        this.rating = source["rating"];
	        this.timestamp = this.convertValues(source["timestamp"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ApplicationsStatistics {
	    total_applications: number;
	    status_counts: {[key: string]: number};
	    portal_counts: {[key: string]: number};
	    response_rate: number;
	    interview_rate: number;
	    offer_rate: number;
	    avg_response_time: number;
	    total_interviews: number;
	    total_offers: number;
	
	    static createFrom(source: any = {}) {
	        return new ApplicationsStatistics(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.total_applications = source["total_applications"];
	        this.status_counts = source["status_counts"];
	        this.portal_counts = source["portal_counts"];
	        this.response_rate = source["response_rate"];
	        this.interview_rate = source["interview_rate"];
	        this.offer_rate = source["offer_rate"];
	        this.avg_response_time = source["avg_response_time"];
	        this.total_interviews = source["total_interviews"];
	        this.total_offers = source["total_offers"];
	    }
	}
	export class Language {
	    id: string;
	    name: string;
	    level: number;
	
	    static createFrom(source: any = {}) {
	        return new Language(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.level = source["level"];
	    }
	}
	export class Skill {
	    id: string;
	    name: string;
	    level: number;
	    category: string;
	
	    static createFrom(source: any = {}) {
	        return new Skill(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.level = source["level"];
	        this.category = source["category"];
	    }
	}
	export class Education {
	    id: string;
	    degree: string;
	    institution: string;
	    start_date: string;
	    end_date: string;
	    gpa: string;
	    description: string;
	    // Go type: time
	    created_at: any;
	
	    static createFrom(source: any = {}) {
	        return new Education(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.degree = source["degree"];
	        this.institution = source["institution"];
	        this.start_date = source["start_date"];
	        this.end_date = source["end_date"];
	        this.gpa = source["gpa"];
	        this.description = source["description"];
	        this.created_at = this.convertValues(source["created_at"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class WorkExperience {
	    id: string;
	    position: string;
	    company: string;
	    location: string;
	    start_date: string;
	    end_date: string;
	    tasks: string[];
	    // Go type: time
	    created_at: any;
	
	    static createFrom(source: any = {}) {
	        return new WorkExperience(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.position = source["position"];
	        this.company = source["company"];
	        this.location = source["location"];
	        this.start_date = source["start_date"];
	        this.end_date = source["end_date"];
	        this.tasks = source["tasks"];
	        this.created_at = this.convertValues(source["created_at"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class CV {
	    id: string;
	    // Go type: time
	    created_at: any;
	    // Go type: time
	    updated_at: any;
	    firstname: string;
	    lastname: string;
	    job_title: string;
	    email: string;
	    phone: string;
	    address: string;
	    city: string;
	    country: string;
	    postal_code: string;
	    linkedin: string;
	    github: string;
	    website: string;
	    photo_path: string;
	    summary: string;
	    work_experience: WorkExperience[];
	    education: Education[];
	    skills: Skill[];
	    languages: Language[];
	    documents: string[];
	    template: string;
	    target_job: string;
	    target_company: string;
	    notes: string;
	    tags: string[];
	    category: string;
	    status: string;
	    color_scheme: string;
	    language: string;
	    view_count: number;
	    // Go type: time
	    last_viewed?: any;
	    // Go type: time
	    last_exported?: any;
	    export_count: number;
	
	    static createFrom(source: any = {}) {
	        return new CV(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.created_at = this.convertValues(source["created_at"], null);
	        this.updated_at = this.convertValues(source["updated_at"], null);
	        this.firstname = source["firstname"];
	        this.lastname = source["lastname"];
	        this.job_title = source["job_title"];
	        this.email = source["email"];
	        this.phone = source["phone"];
	        this.address = source["address"];
	        this.city = source["city"];
	        this.country = source["country"];
	        this.postal_code = source["postal_code"];
	        this.linkedin = source["linkedin"];
	        this.github = source["github"];
	        this.website = source["website"];
	        this.photo_path = source["photo_path"];
	        this.summary = source["summary"];
	        this.work_experience = this.convertValues(source["work_experience"], WorkExperience);
	        this.education = this.convertValues(source["education"], Education);
	        this.skills = this.convertValues(source["skills"], Skill);
	        this.languages = this.convertValues(source["languages"], Language);
	        this.documents = source["documents"];
	        this.template = source["template"];
	        this.target_job = source["target_job"];
	        this.target_company = source["target_company"];
	        this.notes = source["notes"];
	        this.tags = source["tags"];
	        this.category = source["category"];
	        this.status = source["status"];
	        this.color_scheme = source["color_scheme"];
	        this.language = source["language"];
	        this.view_count = source["view_count"];
	        this.last_viewed = this.convertValues(source["last_viewed"], null);
	        this.last_exported = this.convertValues(source["last_exported"], null);
	        this.export_count = source["export_count"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class CVSummary {
	    id: string;
	    name: string;
	    job_title: string;
	    status: string;
	    category: string;
	    tags: string[];
	    target_job: string;
	    target_company: string;
	    // Go type: time
	    updated_at: any;
	    work_count: number;
	    education_count: number;
	    skills_count: number;
	
	    static createFrom(source: any = {}) {
	        return new CVSummary(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.job_title = source["job_title"];
	        this.status = source["status"];
	        this.category = source["category"];
	        this.tags = source["tags"];
	        this.target_job = source["target_job"];
	        this.target_company = source["target_company"];
	        this.updated_at = this.convertValues(source["updated_at"], null);
	        this.work_count = source["work_count"];
	        this.education_count = source["education_count"];
	        this.skills_count = source["skills_count"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ComplianceEntry {
	    // Go type: time
	    timestamp: any;
	    operation: string;
	    data_type: string;
	    record_id: string;
	    legal_basis: string;
	    description: string;
	
	    static createFrom(source: any = {}) {
	        return new ComplianceEntry(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.timestamp = this.convertValues(source["timestamp"], null);
	        this.operation = source["operation"];
	        this.data_type = source["data_type"];
	        this.record_id = source["record_id"];
	        this.legal_basis = source["legal_basis"];
	        this.description = source["description"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	export class GDPRArticle {
	    article: string;
	    title: string;
	    description: string;
	    link: string;
	    compliance: string;
	
	    static createFrom(source: any = {}) {
	        return new GDPRArticle(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.article = source["article"];
	        this.title = source["title"];
	        this.description = source["description"];
	        this.link = source["link"];
	        this.compliance = source["compliance"];
	    }
	}
	export class TimelineEvent {
	    id: string;
	    type: string;
	    title: string;
	    details: string;
	    // Go type: time
	    timestamp: any;
	
	    static createFrom(source: any = {}) {
	        return new TimelineEvent(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.type = source["type"];
	        this.title = source["title"];
	        this.details = source["details"];
	        this.timestamp = this.convertValues(source["timestamp"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class JobApplication {
	    id: string;
	    // Go type: time
	    created_at: any;
	    // Go type: time
	    updated_at: any;
	    cv_id: string;
	    cv_snapshot: string;
	    job_title: string;
	    company: string;
	    company_website: string;
	    job_description: string;
	    location: string;
	    salary: string;
	    job_type: string;
	    remote: boolean;
	    hybrid: boolean;
	    portal: string;
	    portal_url: string;
	    application_url: string;
	    // Go type: time
	    applied_date?: any;
	    status: string;
	    priority: number;
	    // Go type: time
	    deadline?: any;
	    contact_name: string;
	    contact_email: string;
	    contact_phone: string;
	    timeline: TimelineEvent[];
	    feedback: ApplicationFeedback[];
	    documents_submitted: string[];
	    tags: string[];
	    notes: string;
	    color: string;
	    ai_match_score: number;
	    ai_suggestions: string;
	    // Go type: time
	    auto_follow_up_date?: any;
	
	    static createFrom(source: any = {}) {
	        return new JobApplication(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.created_at = this.convertValues(source["created_at"], null);
	        this.updated_at = this.convertValues(source["updated_at"], null);
	        this.cv_id = source["cv_id"];
	        this.cv_snapshot = source["cv_snapshot"];
	        this.job_title = source["job_title"];
	        this.company = source["company"];
	        this.company_website = source["company_website"];
	        this.job_description = source["job_description"];
	        this.location = source["location"];
	        this.salary = source["salary"];
	        this.job_type = source["job_type"];
	        this.remote = source["remote"];
	        this.hybrid = source["hybrid"];
	        this.portal = source["portal"];
	        this.portal_url = source["portal_url"];
	        this.application_url = source["application_url"];
	        this.applied_date = this.convertValues(source["applied_date"], null);
	        this.status = source["status"];
	        this.priority = source["priority"];
	        this.deadline = this.convertValues(source["deadline"], null);
	        this.contact_name = source["contact_name"];
	        this.contact_email = source["contact_email"];
	        this.contact_phone = source["contact_phone"];
	        this.timeline = this.convertValues(source["timeline"], TimelineEvent);
	        this.feedback = this.convertValues(source["feedback"], ApplicationFeedback);
	        this.documents_submitted = source["documents_submitted"];
	        this.tags = source["tags"];
	        this.notes = source["notes"];
	        this.color = source["color"];
	        this.ai_match_score = source["ai_match_score"];
	        this.ai_suggestions = source["ai_suggestions"];
	        this.auto_follow_up_date = this.convertValues(source["auto_follow_up_date"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	export class SecurityInfo {
	    encryption_algorithm: string;
	    encryption_key_size: number;
	    database_type: string;
	    data_location: string;
	    encryption_status: string;
	    compliance_status: string;
	    gdpr_articles: GDPRArticle[];
	
	    static createFrom(source: any = {}) {
	        return new SecurityInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.encryption_algorithm = source["encryption_algorithm"];
	        this.encryption_key_size = source["encryption_key_size"];
	        this.database_type = source["database_type"];
	        this.data_location = source["data_location"];
	        this.encryption_status = source["encryption_status"];
	        this.compliance_status = source["compliance_status"];
	        this.gdpr_articles = this.convertValues(source["gdpr_articles"], GDPRArticle);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	export class Statistics {
	    total_cvs: number;
	    status_counts: {[key: string]: number};
	    category_counts: {[key: string]: number};
	    template_counts: {[key: string]: number};
	    all_tags: string[];
	    total_work_experience: number;
	    total_education: number;
	    total_skills: number;
	    avg_work_per_cv: number;
	    avg_education_per_cv: number;
	    avg_skills_per_cv: number;
	
	    static createFrom(source: any = {}) {
	        return new Statistics(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.total_cvs = source["total_cvs"];
	        this.status_counts = source["status_counts"];
	        this.category_counts = source["category_counts"];
	        this.template_counts = source["template_counts"];
	        this.all_tags = source["all_tags"];
	        this.total_work_experience = source["total_work_experience"];
	        this.total_education = source["total_education"];
	        this.total_skills = source["total_skills"];
	        this.avg_work_per_cv = source["avg_work_per_cv"];
	        this.avg_education_per_cv = source["avg_education_per_cv"];
	        this.avg_skills_per_cv = source["avg_skills_per_cv"];
	    }
	}
	export class StorageSealConfig {
	    is_sealed: boolean;
	    password_hash: string;
	    // Go type: time
	    seal_timestamp?: any;
	    // Go type: time
	    unseal_timestamp?: any;
	    requires_password: boolean;
	
	    static createFrom(source: any = {}) {
	        return new StorageSealConfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.is_sealed = source["is_sealed"];
	        this.password_hash = source["password_hash"];
	        this.seal_timestamp = this.convertValues(source["seal_timestamp"], null);
	        this.unseal_timestamp = this.convertValues(source["unseal_timestamp"], null);
	        this.requires_password = source["requires_password"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	export class UserConsent {
	    consent_given: boolean;
	    // Go type: time
	    consent_timestamp: any;
	    consent_version: string;
	    data_processing: boolean;
	    data_storage: boolean;
	    data_encryption: boolean;
	    consent_withdrawn: boolean;
	    // Go type: time
	    withdrawal_date?: any;
	
	    static createFrom(source: any = {}) {
	        return new UserConsent(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.consent_given = source["consent_given"];
	        this.consent_timestamp = this.convertValues(source["consent_timestamp"], null);
	        this.consent_version = source["consent_version"];
	        this.data_processing = source["data_processing"];
	        this.data_storage = source["data_storage"];
	        this.data_encryption = source["data_encryption"];
	        this.consent_withdrawn = source["consent_withdrawn"];
	        this.withdrawal_date = this.convertValues(source["withdrawal_date"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

