import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'memory.dart';
import 'memory_store.dart';
import 'legacy_migration.dart';
import 'pairing_scanner.dart';
import 'sync_connection_page.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  try {
    final store = await MemoryStore.open();
    runApp(
      MaterialApp(
        title: 'Nai Mobile',
        debugShowCheckedModeBanner: false,
        theme: ThemeData.dark(useMaterial3: true),
        home: MemoryHome(store: store),
      ),
    );
  } on LegacyDatabaseException {
    runApp(
      MaterialApp(
        title: 'Nai Mobile',
        debugShowCheckedModeBanner: false,
        theme: ThemeData.dark(useMaterial3: true),
        home: const LegacyMigrationPage(),
      ),
    );
  } catch (_) {
    runApp(
      MaterialApp(
        title: 'Nai Mobile',
        debugShowCheckedModeBanner: false,
        theme: ThemeData.dark(useMaterial3: true),
        home: const Scaffold(
          body: Center(
            child: Padding(
              padding: EdgeInsets.all(24),
              child: Text(
                'La base local no se pudo abrir de forma segura. Los datos existentes se conservaron. '
                'La sincronización está bloqueada hasta completar una migración segura.',
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class LegacyMigrationPage extends StatefulWidget {
  const LegacyMigrationPage({super.key});

  @override
  State<LegacyMigrationPage> createState() => _LegacyMigrationPageState();
}

class _LegacyMigrationPageState extends State<LegacyMigrationPage> {
  bool busy = false;
  String? error;

  Future<void> migrate() async {
    setState(() {
      busy = true;
      error = null;
    });
    try {
      await migrateLegacyDatabase();
      final store = await MemoryStore.open();
      if (!mounted) {
        await store.db.close();
        return;
      }
      await Navigator.of(context).pushReplacement(
        MaterialPageRoute<void>(builder: (_) => MemoryHome(store: store)),
      );
    } catch (_) {
      if (mounted) {
        setState(
          () => error =
              'No se pudo verificar la migración. La base '
              'anterior se conserva y la apertura sigue bloqueada.',
        );
      }
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Migración de memorias')),
    body: Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              'Se encontró una base local antigua sin cifrar. '
              'Nai Mobile copiará sus memorias a SQLCipher y verificará la copia '
              'antes de retirar los archivos antiguos. La sincronización '
              'permanece bloqueada hasta completar este paso.',
            ),
            const SizedBox(height: 20),
            if (error != null)
              Text(
                error!,
                style: TextStyle(color: Theme.of(context).colorScheme.error),
              ),
            if (busy)
              const CircularProgressIndicator()
            else
              FilledButton(
                onPressed: migrate,
                child: const Text('Migrar a base cifrada'),
              ),
          ],
        ),
      ),
    ),
  );
}

class MemoryHome extends StatefulWidget {
  final MemoryStore store;
  const MemoryHome({super.key, required this.store});
  @override
  State<MemoryHome> createState() => _MemoryHomeState();
}

class _MemoryHomeState extends State<MemoryHome> {
  List<String> projects = [];
  List<MemoryItem> items = [];
  String? current;
  String query = '';
  bool busy = false;
  @override
  void initState() {
    super.initState();
    refresh();
  }

  Future<void> refresh() async {
    final ps = await widget.store.projects();
    final ms = await widget.store.search(project: current, query: query);
    if (mounted)
      setState(() {
        projects = ps;
        items = ms;
      });
  }

  void note(String value) {
    if (mounted)
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(value)));
  }

  Future<void> importFile() async {
    if (busy) return;
    setState(() => busy = true);
    try {
      final selected = await FilePicker.pickFile(
        type: FileType.custom,
        allowedExtensions: ['json'],
      );
      if (selected == null) return;
      final size = selected.lengthSync() ?? await selected.length();
      if (size == null || size > 32 * 1024 * 1024)
        throw const FormatException('Archivo inaccesible o demasiado grande.');
      final snapshot = Snapshot.parse(await selected.readAsBytes());
      final stats = await widget.store.importSnapshot(snapshot);
      await refresh();
      note(
        'Importado: ${stats['added']} nuevas, ${stats['updated']} actualizadas.',
      );
    } catch (e) {
      note('Importacion rechazada: $e');
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(
      title: const Text('Nai Mobile'),
      actions: [
        IconButton(
          tooltip: 'Conexion TLS segura',
          onPressed: () async {
            await Navigator.of(context).push(
              MaterialPageRoute<void>(
                builder: (_) => SyncConnectionPage(store: widget.store),
              ),
            );
            await refresh();
          },
          icon: const Icon(Icons.devices),
        ),
        IconButton(
          tooltip: 'Escanear invitación QR',
          onPressed: () => Navigator.of(context).push(
            MaterialPageRoute<void>(builder: (_) => const PairingScannerPage()),
          ),
          icon: const Icon(Icons.qr_code_scanner),
        ),
        IconButton(onPressed: refresh, icon: const Icon(Icons.refresh)),
      ],
    ),
    floatingActionButton: FloatingActionButton.extended(
      onPressed: busy ? null : importFile,
      icon: const Icon(Icons.file_open),
      label: const Text('Importar JSON'),
    ),
    body: Column(
      children: [
        const Padding(
          padding: EdgeInsets.all(12),
          child: Text('Memorias offline · Sin sincronizacion automatica'),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: TextField(
            decoration: const InputDecoration(
              labelText: 'Buscar memorias',
              prefixIcon: Icon(Icons.search),
            ),
            onChanged: (value) {
              query = value;
              refresh();
            },
          ),
        ),
        SizedBox(
          height: 54,
          child: ListView(
            scrollDirection: Axis.horizontal,
            children: [
              Padding(
                padding: const EdgeInsets.all(5),
                child: ChoiceChip(
                  label: const Text('Todos'),
                  selected: current == null,
                  onSelected: (_) {
                    setState(() => current = null);
                    refresh();
                  },
                ),
              ),
              ...projects.map(
                (name) => Padding(
                  padding: const EdgeInsets.all(5),
                  child: ChoiceChip(
                    label: Text(name),
                    selected: current == name,
                    onSelected: (_) {
                      setState(() => current = name);
                      refresh();
                    },
                  ),
                ),
              ),
            ],
          ),
        ),
        Expanded(
          child: items.isEmpty
              ? const Center(
                  child: Text('Sin memorias. Importa un JSON de prueba.'),
                )
              : ListView.builder(
                  itemCount: items.length,
                  itemBuilder: (context, i) {
                    final m = items[i];
                    return ListTile(
                      title: Text(
                        m.content.split('\n').first,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      subtitle: Text(m.project),
                      trailing: const Icon(Icons.chevron_right),
                      onTap: () => Navigator.of(context).push(
                        MaterialPageRoute<void>(
                          builder: (_) => Scaffold(
                            appBar: AppBar(title: Text(m.project)),
                            body: ListView(
                              padding: const EdgeInsets.all(20),
                              children: [SelectableText(m.content)],
                            ),
                          ),
                        ),
                      ),
                    );
                  },
                ),
        ),
      ],
    ),
  );
}
