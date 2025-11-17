import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import {
  Search,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Filter,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  ArrowUpDown
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import {
  fadeInUp,
  staggerContainer,
  staggerItem
} from "@/lib/animations";

// Mock client data - will be replaced with Supabase data
const mockClients = [
  {
    id: 1,
    name: "Tech Startup Inc",
    contactEmail: "contact@techstartup.com",
    status: "active",
    postsGenerated: 42,
    lastActive: "2 hours ago",
    createdAt: "2024-01-15",
  },
  {
    id: 2,
    name: "Marketing Agency Co",
    contactEmail: "hello@marketingco.com",
    status: "active",
    postsGenerated: 38,
    lastActive: "5 hours ago",
    createdAt: "2024-02-01",
  },
  {
    id: 3,
    name: "E-commerce Store",
    contactEmail: "support@ecommerce.com",
    status: "inactive",
    postsGenerated: 15,
    lastActive: "3 days ago",
    createdAt: "2024-03-10",
  },
  {
    id: 4,
    name: "Local Business LLC",
    contactEmail: "info@localbiz.com",
    status: "pending",
    postsGenerated: 0,
    lastActive: "Never",
    createdAt: "2024-03-28",
  },
  {
    id: 5,
    name: "Creative Studio",
    contactEmail: "team@creative.studio",
    status: "active",
    postsGenerated: 67,
    lastActive: "1 hour ago",
    createdAt: "2023-12-20",
  },
];

const ClientManagement = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name");
  const [isLoading, setIsLoading] = useState(false);

  const filteredClients = mockClients
    .filter((client) => {
      const matchesSearch =
        client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.contactEmail.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter =
        filterStatus === "all" || client.status === filterStatus;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "posts") return b.postsGenerated - a.postsGenerated;
      return 0;
    });

  const stats = {
    total: mockClients.length,
    active: mockClients.filter((c) => c.status === "active").length,
    inactive: mockClients.filter((c) => c.status === "inactive").length,
    pending: mockClients.filter((c) => c.status === "pending").length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-foreground bg-foreground/5 border-foreground/10";
      case "inactive":
        return "text-muted-foreground bg-muted border-border";
      case "pending":
        return "text-muted-foreground bg-muted/50 border-border";
      default:
        return "text-muted-foreground bg-muted border-border";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle2 className="h-3 w-3" />;
      case "inactive":
        return <XCircle className="h-3 w-3" />;
      case "pending":
        return <Clock className="h-3 w-3" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold mb-2">Client Management</h1>
              <p className="text-muted-foreground text-lg">
                Manage all your client accounts in one place
              </p>
            </div>
            <Button
              className="btn-premium gap-2"
              onClick={() => navigate("/clients/new")}
            >
              <Plus className="h-5 w-5" />
              Add Client
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="metric-card">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-foreground/5 border border-foreground/10 rounded-lg">
                  <Users className="h-5 w-5 text-foreground" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <div className="text-sm text-muted-foreground">
                    Total Clients
                  </div>
                </div>
              </div>
            </Card>

            <Card className="metric-card">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-foreground/5 border border-foreground/10 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-foreground" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.active}</div>
                  <div className="text-sm text-muted-foreground">Active</div>
                </div>
              </div>
            </Card>

            <Card className="metric-card">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted border border-border rounded-lg">
                  <XCircle className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.inactive}</div>
                  <div className="text-sm text-muted-foreground">Inactive</div>
                </div>
              </div>
            </Card>

            <Card className="metric-card">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted/50 border border-border rounded-lg">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.pending}</div>
                  <div className="text-sm text-muted-foreground">Pending</div>
                </div>
              </div>
            </Card>
          </div>
        </motion.div>

        {/* Filters and Search */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search clients by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filter */}
              <div className="flex gap-2">
                <Button
                  variant={filterStatus === "all" ? "default" : "outline"}
                  onClick={() => setFilterStatus("all")}
                  className="gap-2"
                >
                  All
                </Button>
                <Button
                  variant={filterStatus === "active" ? "default" : "outline"}
                  onClick={() => setFilterStatus("active")}
                  className="gap-2"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Active
                </Button>
                <Button
                  variant={filterStatus === "inactive" ? "default" : "outline"}
                  onClick={() => setFilterStatus("inactive")}
                  className="gap-2"
                >
                  <XCircle className="h-4 w-4" />
                  Inactive
                </Button>
                <Button
                  variant={filterStatus === "pending" ? "default" : "outline"}
                  onClick={() => setFilterStatus("pending")}
                  className="gap-2"
                >
                  <Clock className="h-4 w-4" />
                  Pending
                </Button>
              </div>

              {/* Export */}
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Client Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full">
                <thead className="bg-muted/30 border-b border-border">
                  <tr>
                    <th className="text-left p-4 font-semibold">
                      <div className="flex items-center gap-2 cursor-pointer hover:text-foreground transition-colors">
                        Client Name
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </th>
                    <th className="text-left p-4 font-semibold">
                      Contact Email
                    </th>
                    <th className="text-left p-4 font-semibold">Status</th>
                    <th className="text-left p-4 font-semibold">
                      <div className="flex items-center gap-2 cursor-pointer hover:text-foreground transition-colors">
                        Posts Generated
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </th>
                    <th className="text-left p-4 font-semibold">
                      Last Active
                    </th>
                    <th className="text-left p-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {filteredClients.map((client, index) => (
                      <motion.tr
                        key={client.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ delay: index * 0.05 }}
                        className="table-row-hover border-b border-border last:border-0"
                      >
                        <td className="p-4">
                          <div className="font-medium">{client.name}</div>
                          <div className="text-sm text-muted-foreground">
                            Since {client.createdAt}
                          </div>
                        </td>
                        <td className="p-4 text-muted-foreground">
                          {client.contactEmail}
                        </td>
                        <td className="p-4">
                          <div
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                              client.status
                            )}`}
                          >
                            {getStatusIcon(client.status)}
                            <span className="capitalize">{client.status}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="font-semibold">
                            {client.postsGenerated}
                          </div>
                        </td>
                        <td className="p-4 text-muted-foreground">
                          {client.lastActive}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-2"
                              onClick={() =>
                                navigate(`/clients/${client.id}`)
                              }
                            >
                              <Eye className="h-4 w-4" />
                              View
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-2"
                              onClick={() =>
                                navigate(`/clients/${client.id}/edit`)
                              }
                            >
                              <Edit className="h-4 w-4" />
                              Edit
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>

              {/* Empty State */}
              {filteredClients.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="empty-state py-16"
                >
                  <div className="p-4 bg-muted/30 border border-border rounded-full w-fit mx-auto mb-4">
                    <Users className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">
                    No clients found
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    {searchQuery
                      ? "Try adjusting your search or filters"
                      : "Get started by adding your first client"}
                  </p>
                  {!searchQuery && (
                    <Button
                      className="btn-premium gap-2"
                      onClick={() => navigate("/clients/new")}
                    >
                      <Plus className="h-5 w-5" />
                      Add Your First Client
                    </Button>
                  )}
                </motion.div>
              )}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default ClientManagement;
